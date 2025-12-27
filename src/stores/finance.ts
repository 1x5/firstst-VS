import { create } from 'zustand';
import type { Transaction, TransactionType, NewTransaction, UpdateTransaction } from '@/types/transaction';
import { transactionsService } from '@/services/transactions';

interface FinanceState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  
  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (transaction: Partial<NewTransaction> & Pick<NewTransaction, 'type' | 'amount' | 'category' | 'categoryName' | 'date'>, userId: string) => Promise<void>;
  updateTransaction: (id: string, transaction: UpdateTransaction, userId: string) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  clearAll: () => void;
  setOnline: (isOnline: boolean) => void;
  clearError: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  isOnline: navigator.onLine,
  
  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const transactions = await transactionsService.getAll();
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка сохранения';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  updateTransaction: async (id, transaction, userId) => {
    set({ error: null });
    
    try {
      const updated = await transactionsService.update(id, transaction, userId);
      set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === id ? updated : t
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка обновления';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  removeTransaction: async (id) => {
    set({ error: null });
    
    const previousTransactions = get().transactions;
    
    // Оптимистичное обновление
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
    
    try {
      await transactionsService.delete(id);
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
