import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  getLogsByType: (type: 'income' | 'expense') => ActivityLog[];
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
        return get().logs.filter((log) => log.type === type);
      },
    }),
    {
      name: 'activity-log-storage',
    }
  )
);

