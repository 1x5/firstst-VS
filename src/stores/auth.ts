import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { useFinanceStore } from './finance';
import { useCategoriesStore } from './categories';
import { useActivityLogStore } from './activityLog';
import { transactionsService } from '@/services/transactions';
import { categoriesService } from '@/services/categories';
import { activityLogsService } from '@/services/activityLogs';
import { translateError } from '@/lib/translate-error';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

// Функция для загрузки данных пользователя с оптимизацией через React Query
const loadUserData = async (userId: string) => {
  if (import.meta.env.DEV) {
    console.log('[loadUserData] Starting data load for user:', userId);
  }

  try {
    // Получаем queryClient из глобальной переменной (устанавливается в main.tsx)
    // Это позволяет React Query управлять кешем и дедупликацией запросов
    const queryClient: QueryClient | undefined = typeof window !== 'undefined' 
      ? (window as any).__REACT_QUERY_CLIENT__
      : undefined;

    // Предзагружаем данные через React Query для кеширования и дедупликации
    // Promise.allSettled используется вместо Promise.all, чтобы ошибки в одном запросе не блокировали остальные
    const results = await Promise.allSettled([
      // Загружаем транзакции
      queryClient 
        ? queryClient.prefetchQuery({
            queryKey: ['transactions', 50, 0],
            queryFn: () => transactionsService.getAll(50, 0),
            staleTime: 1000 * 60 * 2,
          }).then(() => useFinanceStore.getState().loadTransactions())
        : useFinanceStore.getState().loadTransactions(),
      
      // Загружаем категории
      queryClient
        ? queryClient.prefetchQuery({
            queryKey: ['categories', userId],
            queryFn: () => categoriesService.initializeDefaults(userId),
            staleTime: 1000 * 60 * 5,
          }).then(() => useCategoriesStore.getState().loadCategories(userId))
        : useCategoriesStore.getState().loadCategories(userId),
      
      // Загружаем логи
      queryClient
        ? queryClient.prefetchQuery({
            queryKey: ['activityLogs', userId, 100],
            queryFn: () => activityLogsService.getAll(100),
            staleTime: 1000 * 30,
          }).then(() => useActivityLogStore.getState().loadLogs(userId))
        : useActivityLogStore.getState().loadLogs(userId),
    ]);

    // Логируем результаты
    if (import.meta.env.DEV) {
      results.forEach((result, index) => {
        const names = ['transactions', 'categories', 'activityLogs'];
        if (result.status === 'rejected') {
          console.error(`[loadUserData] Failed to load ${names[index]}:`, result.reason);
        } else {
          console.log(`[loadUserData] Successfully loaded ${names[index]}`);
        }
      });
    }
  } catch (error) {
    // Не блокируем вход, если загрузка данных не удалась
    if (import.meta.env.DEV) {
      console.error('[loadUserData] Error loading user data:', error);
    }
    // Продолжаем выполнение - пользователь все равно должен войти
  }
};

// Функция для очистки данных
const clearUserData = () => {
  useFinanceStore.getState().clearAll();
  useCategoriesStore.getState().clearAll();
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        await loadUserData(session.user.id);
      }
      
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });

      // Подписываемся на изменения авторизации
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (import.meta.env.DEV) {
          console.log('[onAuthStateChange] Event:', event, 'User:', session?.user?.id);
        }
        
        if (session?.user) {
          try {
            await loadUserData(session.user.id);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[onAuthStateChange] Error loading user data:', error);
            }
          }
        } else {
          clearUserData();
        }
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? translateError(error.message) : 'Ошибка инициализации',
      });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserData(data.user.id);
      }

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? translateError(error.message) : 'Ошибка регистрации',
      });
      return false;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    // Защита от brute-force: проверка количества попыток
    // Используем прямой доступ к localStorage для синхронной работы
    const attemptKey = `login_attempts_${email}`;
    const lockoutKey = `login_lockout_${email}`;
    const maxAttempts = 5;
    const lockoutTime = 15 * 60 * 1000; // 15 минут
    
    try {
      // Проверка блокировки
      if (typeof window !== 'undefined' && window.localStorage) {
        const lockoutUntil = window.localStorage.getItem(lockoutKey);
        if (lockoutUntil && Date.now() < parseInt(lockoutUntil, 10)) {
          const minutesLeft = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 60000);
          const errorMsg = `Слишком много попыток. Попробуйте через ${minutesLeft} минут`;
          
          if (import.meta.env.DEV) {
            console.warn('[signIn] Account locked:', { email, lockoutUntil, minutesLeft });
          }
          
          set({
            isLoading: false,
            error: errorMsg,
          });
          return false;
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('[signIn] Attempting login for:', email);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[signIn] Login error:', error);
        }
        
        // Увеличиваем счетчик неудачных попыток
        if (typeof window !== 'undefined' && window.localStorage) {
          const attempts = parseInt(window.localStorage.getItem(attemptKey) || '0', 10);
          const newAttempts = attempts + 1;
          window.localStorage.setItem(attemptKey, String(newAttempts));
          
          if (import.meta.env.DEV) {
            console.warn('[signIn] Failed attempt:', { email, attempts: newAttempts, maxAttempts });
          }
          
          // Блокируем после maxAttempts попыток
          if (newAttempts >= maxAttempts) {
            const lockoutUntil = Date.now() + lockoutTime;
            window.localStorage.setItem(lockoutKey, String(lockoutUntil));
            
            if (import.meta.env.DEV) {
              console.warn('[signIn] Account locked after', maxAttempts, 'attempts');
            }
          }
        }
        
        throw error;
      }

      if (import.meta.env.DEV) {
        console.log('[signIn] Login successful:', { email, userId: data.user?.id });
      }

      // Сбрасываем счетчик при успешном входе
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(attemptKey);
        window.localStorage.removeItem(lockoutKey);
        
        if (import.meta.env.DEV) {
          console.log('[signIn] Cleared login attempt counters');
        }
      }

      // Загружаем данные пользователя (не блокируем вход при ошибках)
      try {
        await loadUserData(data.user.id);
      } catch (loadError) {
        if (import.meta.env.DEV) {
          console.error('[signIn] Error loading user data, but continuing login:', loadError);
        }
        // Продолжаем вход даже если загрузка данных не удалась
      }

      // Обновляем состояние - это важно сделать в любом случае
      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      if (import.meta.env.DEV) {
        console.log('[signIn] State updated, user should be redirected');
        console.log('[signIn] User object:', data.user);
        console.log('[signIn] Session object:', data.session);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error 
        ? translateError(error.message)
        : 'Ошибка входа';
      
      if (import.meta.env.DEV) {
        console.error('[signIn] Final error:', { error, message });
      }
      
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    if (import.meta.env.DEV) {
      console.log('[signOut] ===== STARTING SIGN OUT =====');
    }
    
    // Сначала очищаем локальные данные
    clearUserData();
    
    // Очищаем состояние сразу, не дожидаясь ответа от Supabase
    // Это обеспечит мгновенный выход даже если запрос к Supabase завершится ошибкой
    set({
      user: null,
      session: null,
      isLoading: false,
    });
    
    // Пытаемся выйти из Supabase в фоне (не блокируем UI)
    // Игнорируем все ошибки, так как локальное состояние уже очищено
    supabase.auth.signOut({ scope: 'local' }).catch((error) => {
      if (import.meta.env.DEV) {
        console.warn('[signOut] Supabase signOut error (ignored):', error);
        console.warn('[signOut] Local state already cleared, user is logged out');
      }
      // Игнорируем ошибку - локальное состояние уже очищено
    });
    
    if (import.meta.env.DEV) {
      console.log('[signOut] ===== SIGN OUT SUCCESS (local state cleared) =====');
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Всегда используем production URL для redirect
      const redirectUrl = 'https://uchet1.ru/auth/reset-password';
      
      if (import.meta.env.DEV) {
        console.log('[resetPassword] ===== STARTING PASSWORD RESET =====');
        console.log('[resetPassword] Email:', email);
        console.log('[resetPassword] Redirect URL:', redirectUrl);
        console.log('[resetPassword] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      }
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[resetPassword] ===== SUPABASE ERROR =====');
          console.error('[resetPassword] Error code:', error.status || error.code);
          console.error('[resetPassword] Error message:', error.message);
          console.error('[resetPassword] Full error:', error);
        }
        throw error;
      }

      if (import.meta.env.DEV) {
        console.log('[resetPassword] ===== SUCCESS =====');
        console.log('[resetPassword] Response data:', data);
        console.log('[resetPassword] Email should be sent to:', email);
        console.log('[resetPassword] ⚠️ ВАЖНО: Проверьте папку СПАМ!');
        console.log('[resetPassword] ⚠️ ВАЖНО: Если письмо не пришло, проверьте настройки Supabase Dashboard');
        console.log('[resetPassword] ⚠️ ВАЖНО: URL должен быть добавлен в Redirect URLs: https://uchet1.ru/auth/reset-password');
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? translateError(error.message) : 'Ошибка отправки письма';
      
      if (import.meta.env.DEV) {
        console.error('[resetPassword] ===== FINAL ERROR =====');
        console.error('[resetPassword] Error object:', error);
        console.error('[resetPassword] Error message:', errorMessage);
        
        // Дополнительная диагностика
        if (error instanceof Error) {
          if (error.message.includes('redirect_to')) {
            console.error('[resetPassword] ⚠️ ПРОБЛЕМА: URL не добавлен в Supabase Dashboard!');
            console.error('[resetPassword] Решение: Добавьте https://uchet1.ru/auth/reset-password в Redirect URLs');
          }
          if (error.message.includes('rate limit') || error.message.includes('too many')) {
            console.error('[resetPassword] ⚠️ ПРОБЛЕМА: Превышен лимит отправки писем!');
            console.error('[resetPassword] Решение: Подождите некоторое время');
          }
        }
      }
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    
    if (import.meta.env.DEV) {
      console.log('[updatePassword] ===== STARTING PASSWORD UPDATE =====');
    }
    
    // Проверяем текущую сессию
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (import.meta.env.DEV) {
      console.log('[updatePassword] Current session check:', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id,
        email: sessionData.session?.user?.email,
        sessionError: sessionError?.message
      });
    }
    
    if (!sessionData.session) {
      const errorMsg = 'Сессия не найдена. Перейдите по ссылке из письма заново.';
      if (import.meta.env.DEV) {
        console.error('[updatePassword] ⚠️ ПРОБЛЕМА: Нет активной сессии!');
        console.error('[updatePassword] Это означает, что recovery токен не был установлен или истек');
        console.error('[updatePassword] Решение: Перейдите по ссылке из письма еще раз');
      }
      set({
        isLoading: false,
        error: errorMsg,
      });
      return false;
    }
    
    try {
      if (import.meta.env.DEV) {
        console.log('[updatePassword] Calling supabase.auth.updateUser...');
        console.log('[updatePassword] Session type check:', {
          isRecovery: sessionData.session?.user?.app_metadata?.provider === 'email',
          hasRecoveryToken: !!sessionData.session?.access_token
        });
      }
      
      // Для recovery сессии используем updateUser напрямую
      // НЕ используем signIn с grant_type=password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[updatePassword] ===== SUPABASE ERROR =====');
          console.error('[updatePassword] Error code:', error.status || error.code);
          console.error('[updatePassword] Error message:', error.message);
          console.error('[updatePassword] Full error:', error);
        }
        throw error;
      }

      if (import.meta.env.DEV) {
        console.log('[updatePassword] ===== SUCCESS =====');
        console.log('[updatePassword] Password updated successfully:', {
          userId: data.user?.id,
          email: data.user?.email
        });
        console.log('[updatePassword] User can now login with new password');
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? translateError(error.message) : 'Ошибка обновления пароля';
      
      if (import.meta.env.DEV) {
        console.error('[updatePassword] ===== FINAL ERROR =====');
        console.error('[updatePassword] Error object:', error);
        console.error('[updatePassword] Error message:', errorMessage);
      }
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
