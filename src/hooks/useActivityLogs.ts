import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityLogsService } from '@/services/activityLogs';

const ACTIVITY_LOGS_QUERY_KEY = ['activityLogs'] as const;

// Загрузка логов с кешированием
export function useActivityLogs(userId: string, limit: number = 100) {
  return useQuery({
    queryKey: [...ACTIVITY_LOGS_QUERY_KEY, userId, limit],
    queryFn: () => activityLogsService.getAll(limit),
    staleTime: 1000 * 30, // 30 секунд (логи могут обновляться часто)
    gcTime: 1000 * 60 * 2, // 2 минуты
  });
}

// Создание лога (обычно вызывается через store, но можем использовать напрямую)
export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      log, 
      userId, 
      transactionId 
    }: { 
      log: Parameters<typeof activityLogsService.create>[0]; 
      userId: string; 
      transactionId?: string;
    }) => {
      return await activityLogsService.create(log, userId, transactionId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [...ACTIVITY_LOGS_QUERY_KEY, userId] });
    },
  });
}

// Удаление всех логов
export function useDeleteAllActivityLogs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      await activityLogsService.deleteAll(userId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [...ACTIVITY_LOGS_QUERY_KEY, userId] });
    },
  });
}

