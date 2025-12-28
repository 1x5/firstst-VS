import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';

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
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByType: (type: 'income' | 'expense' | 'all') => ActivityLog[];
  getAllLogs: () => ActivityLog[];
}

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      
      addLog: (log) => {
        const newLog: ActivityLog = {
          ...log,
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        };
        
        set((state) => ({
          logs: [newLog, ...state.logs].slice(0, 50), // Храним максимум 50 логов
        }));
      },
      
      clearLogs: () => {
        set({ logs: [] });
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

