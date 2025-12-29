import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsService } from '@/services/transactions';
import type { Transaction, NewTransaction, UpdateTransaction } from '@/types/transaction';
import { useActivityLogStore } from '@/stores/activityLog';

const TRANSACTIONS_QUERY_KEY = ['transactions'] as const;

// Загрузка транзакций с кешированием
export function useTransactions(limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, limit, offset],
    queryFn: () => transactionsService.getAll(limit, offset),
    staleTime: 1000 * 60 * 2, // 2 минуты
    gcTime: 1000 * 60 * 5, // 5 минут (было cacheTime)
  });
}

// Создание транзакции
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transaction, userId }: { transaction: NewTransaction; userId: string }) => {
      const created = await transactionsService.create(transaction, userId);
      
      // Логируем действие
      await useActivityLogStore.getState().addLog({
        type: transaction.type,
        action: 'added',
        amount: transaction.amount,
        description: transaction.description,
        categoryName: transaction.categoryName,
      }, userId, created.id);
      
      return created;
    },
    onSuccess: (created) => {
      // Оптимистично обновляем кеш
      queryClient.setQueryData<Transaction[]>([...TRANSACTIONS_QUERY_KEY, 50, 0], (old) => {
        if (!old) return [created];
        return [created, ...old];
      });
      // Инвалидируем для синхронизации
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}

// Обновление транзакции
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, transaction, userId }: { id: string; transaction: UpdateTransaction; userId: string }) => {
      // Получаем предыдущую транзакцию для логирования
      const previousTransaction = queryClient.getQueryData<Transaction[]>([...TRANSACTIONS_QUERY_KEY, 50, 0])
        ?.find(t => t.id === id);
      
      const updated = await transactionsService.update(id, transaction, userId);
      
      // Логируем действие
      if (previousTransaction) {
        await useActivityLogStore.getState().addLog({
          type: updated.type,
          action: 'updated',
          amount: updated.amount,
          description: updated.description,
          categoryName: updated.categoryName,
        }, userId, updated.id);
      }
      
      return updated;
    },
    onSuccess: (updated) => {
      // Оптимистично обновляем кеш
      queryClient.setQueryData<Transaction[]>([...TRANSACTIONS_QUERY_KEY, 50, 0], (old) => {
        if (!old) return [updated];
        return old.map(t => t.id === updated.id ? updated : t);
      });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}

// Удаление транзакции
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Получаем транзакцию для логирования перед удалением
      const transactions = queryClient.getQueryData<Transaction[]>([...TRANSACTIONS_QUERY_KEY, 50, 0]);
      const deletedTransaction = transactions?.find(t => t.id === id);
      
      await transactionsService.delete(id);
      
      // Логируем действие
      if (deletedTransaction) {
        await useActivityLogStore.getState().addLog({
          type: deletedTransaction.type,
          action: 'deleted',
          amount: deletedTransaction.amount,
          description: deletedTransaction.description,
          categoryName: deletedTransaction.categoryName,
        }, userId, deletedTransaction.id);
      }
    },
    onSuccess: (_, { id }) => {
      // Оптимистично обновляем кеш
      queryClient.setQueryData<Transaction[]>([...TRANSACTIONS_QUERY_KEY, 50, 0], (old) => {
        if (!old) return [];
        return old.filter(t => t.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });
}

