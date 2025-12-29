import { create } from 'zustand';
import type { Transaction, TransactionType, NewTransaction, UpdateTransaction } from '@/types/transaction';
import { transactionsService } from '@/services/transactions';
import { useActivityLogStore } from '@/stores/activityLog';

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Partial<NewTransaction> & Pick<NewTransaction, 'type' | 'amount' | 'category' | 'categoryName' | 'date'>, userId: string) => Promise<void>;
  updateTransaction: (id: string, transaction: UpdateTransaction, userId: string) => Promise<void>;
  removeTransaction: (id: string, userId: string) => Promise<void>;
  clearAll: () => void;
  setOnline: (isOnline: boolean) => void;
  clearError: () => void;
  
  // Optimistic updates для realtime
  addTransactionOptimistic: (transaction: Transaction) => void;
  updateTransactionOptimistic: (id: string, transaction: Transaction) => void;
  removeTransactionOptimistic: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  isOnline: navigator.onLine,
  
  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Загружаем только первые 50 транзакций для производительности
      const transactions = await transactionsService.getAll(50, 0);
      set({ transactions, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ошибка загрузки транзакций',
      });
    }
  },
  
  addTransaction: async (transaction, userId) => {
    set({ error: null });
    
    const newTransaction: NewTransaction = {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      categoryName: transaction.categoryName,
      description: transaction.description || '',
      date: transaction.date,
      isRecurring: transaction.isRecurring ?? false,
      recurringInterval: transaction.recurringInterval ?? null,
      currency: transaction.currency ?? 'RUB',
    };
    
    try {
      const created = await transactionsService.create(newTransaction, userId);
      set((state) => ({
        transactions: [created, ...state.transactions],
      }));
      
      // Логируем действие
      await useActivityLogStore.getState().addLog({
        type: newTransaction.type,
        action: 'added',
        amount: newTransaction.amount,
        description: newTransaction.description,
        categoryName: newTransaction.categoryName,
      }, userId, created.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  updateTransaction: async (id, transaction, userId) => {
    set({ error: null });
    
    const previousTransaction = get().transactions.find((t) => t.id === id);
    
    try {
      const updated = await transactionsService.update(id, transaction, userId);
      set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === id ? updated : t
        ),
      }));
      
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка обновления';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  removeTransaction: async (id, userId) => {
    set({ error: null });
    
    const previousTransactions = get().transactions;
    const deletedTransaction = previousTransactions.find((t) => t.id === id);
    
    // Проверяем, что транзакция существует
    if (!deletedTransaction) {
      throw new Error('Транзакция не найдена');
    }
    
    // Оптимистичное обновление
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    
    try {
      await transactionsService.delete(id);
      
      // Логируем действие
      await useActivityLogStore.getState().addLog({
        type: deletedTransaction.type,
        action: 'deleted',
        amount: deletedTransaction.amount,
        description: deletedTransaction.description,
        categoryName: deletedTransaction.categoryName,
      }, userId, deletedTransaction.id);
    } catch (error) {
      // Откатываем при ошибке
      set({ transactions: previousTransactions });
      const message = error instanceof Error ? error.message : 'Ошибка удаления';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  clearAll: () => {
    set({ transactions: [], error: null });
  },
  
  setOnline: (isOnline) => {
    set({ isOnline });
  },
  
  clearError: () => set({ error: null }),
  
  // Optimistic updates для realtime
  addTransactionOptimistic: (transaction) => {
    set((state) => {
      // Проверка на дубликаты (защита от race condition)
      const exists = state.transactions.some((t) => t.id === transaction.id);
      if (exists) {
        return state; // Не добавляем дубликат
      }
      return {
        transactions: [transaction, ...state.transactions],
      };
    });
  },
  
  updateTransactionOptimistic: (id, transaction) => {
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? transaction : t
      ),
    }));
  },
  
  removeTransactionOptimistic: (id) => {
    set((state) => {
      // Проверка на существование (защита от race condition)
      const exists = state.transactions.some((t) => t.id === id);
      if (!exists) {
        return state; // Уже удалено, не делаем ничего
      }
      return {
        transactions: state.transactions.filter((t) => t.id !== id),
      };
    });
  },
}));

// Селекторы (с защитой от undefined)
export const selectBalance = (state: FinanceState) =>
  (state.transactions || []).reduce((acc, t) => 
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0
  );

export const selectTotalIncome = (state: FinanceState) =>
  (state.transactions || [])
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

export const selectTotalExpense = (state: FinanceState) =>
  (state.transactions || [])
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

export const selectTransactionsByType = (type: TransactionType) => 
  (state: FinanceState) => (state.transactions || []).filter((t) => t.type === type);

export const selectTransactionsByDateRange = (startDate: string, endDate: string) =>
  (state: FinanceState) => (state.transactions || []).filter((t) => 
    t.date >= startDate && t.date <= endDate
  );
