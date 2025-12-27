import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useFinanceStore } from './finance';
import { useCategoriesStore } from './categories';

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
  clearError: () => void;
}

// Функция для загрузки данных пользователя
const loadUserData = async (userId: string) => {
  await Promise.all([
    useFinanceStore.getState().loadTransactions(),
    useCategoriesStore.getState().loadCategories(userId),
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
        error: error instanceof Error ? error.message : 'Ошибка инициализации',
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
        error: error instanceof Error ? error.message : 'Ошибка регистрации',
      });
      return false;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      await loadUserData(data.user.id);

      set({
        user: data.user,
        session: data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      let message = 'Ошибка входа';
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          message = 'Неверный email или пароль';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Подтвердите email';
        } else {
          message = error.message;
        }
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
        error: error instanceof Error ? error.message : 'Ошибка выхода',
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка отправки письма',
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
