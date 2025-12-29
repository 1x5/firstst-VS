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
  // Получаем queryClient из глобальной переменной (устанавливается в main.tsx)
  // Это позволяет React Query управлять кешем и дедупликацией запросов
  const queryClient: QueryClient | undefined = typeof window !== 'undefined' 
    ? (window as any).__REACT_QUERY_CLIENT__
    : undefined;

  // Предзагружаем данные через React Query для кеширования и дедупликации
  // Promise.all оптимизирует параллельную загрузку всех данных одновременно
  await Promise.all([
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
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id);
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
          set({
            isLoading: false,
            error: `Слишком много попыток. Попробуйте через ${minutesLeft} минут`,
          });
          return false;
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Увеличиваем счетчик неудачных попыток
        if (typeof window !== 'undefined' && window.localStorage) {
          const attempts = parseInt(window.localStorage.getItem(attemptKey) || '0', 10);
          const newAttempts = attempts + 1;
          window.localStorage.setItem(attemptKey, String(newAttempts));
          
          // Блокируем после maxAttempts попыток
          if (newAttempts >= maxAttempts) {
            const lockoutUntil = Date.now() + lockoutTime;
            window.localStorage.setItem(lockoutKey, String(lockoutUntil));
          }
        }
        
        throw error;
      }

      // Сбрасываем счетчик при успешном входе
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(attemptKey);
        window.localStorage.removeItem(lockoutKey);
      }

      await loadUserData(data.user.id);

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error 
        ? translateError(error.message)
        : 'Ошибка входа';
      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      clearUserData();

      set({
        user: null,
        session: null,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? translateError(error.message) : 'Ошибка выхода',
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Всегда используем production URL для redirect
      const redirectUrl = 'https://uchet1.ru/auth/reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? translateError(error.message) : 'Ошибка отправки письма',
      });
      return false;
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? translateError(error.message) : 'Ошибка обновления пароля',
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
