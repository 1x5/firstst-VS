import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';
import { activityLogsService } from '@/services/activityLogs';

export interface ActivityLog {
  id: string;
  type: 'income' | 'expense';
  action: 'added' | 'updated' | 'deleted';
  amount?: number;
  description?: string;
  categoryName?: string;
  timestamp: number;
}

interface ActivityLogState {
  logs: ActivityLog[];
  isLoading: boolean;
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>, userId: string, transactionId?: string) => Promise<void>;
  loadLogs: (userId: string) => Promise<void>;
  clearLogs: (userId: string) => Promise<void>;
  getLogsByType: (type: 'income' | 'expense' | 'all') => ActivityLog[];
  getAllLogs: () => ActivityLog[];
}

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      isLoading: false,
      
      addLog: async (log, userId, transactionId) => {
        const newLog: ActivityLog = {
          ...log,
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        };
        
        // Оптимистичное обновление UI
        set((state) => ({
          logs: [newLog, ...state.logs].slice(0, 50), // Храним максимум 50 логов
        }));
        
        // Сохраняем в Supabase в фоне (не блокируем UI)
        try {
          const savedLog = await activityLogsService.create(log, userId, transactionId);
          // Обновляем ID если сохранение успешно
          set((state) => ({
            logs: state.logs.map((l) => 
              l.id === newLog.id ? { ...l, id: savedLog.id } : l
            ),
          }));
        } catch (error) {
          // Если ошибка, лог остается в локальном хранилище
          if (import.meta.env.DEV) {
            console.warn('Не удалось сохранить лог в Supabase:', error);
          }
        }
      },
      
      loadLogs: async (userId: string) => {
        set({ isLoading: true });
        try {
          const logs = await activityLogsService.getAll(50);
          set({ logs, isLoading: false });
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Не удалось загрузить логи из Supabase:', error);
          }
          set({ isLoading: false });
        }
      },
      
      clearLogs: async (userId: string) => {
        // Очищаем локально
        set({ logs: [] });
        
        // Очищаем в Supabase в фоне
        try {
          await activityLogsService.deleteAll(userId);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Не удалось очистить логи в Supabase:', error);
          }
        }
      },
      
      getLogsByType: (type) => {
        if (type === 'all') {
          return get().logs;
        }
        return get().logs.filter((log) => log.type === type);
      },
      
      getAllLogs: () => {
        return get().logs;
      },
    }),
    {
      name: 'activity-log-storage',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

