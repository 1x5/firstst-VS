export type TransactionType = 'income' | 'expense';

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
};

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string; // category_id или legacy category name
  categoryName: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringInterval: RecurringInterval | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// Для создания новой транзакции
export type NewTransaction = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

// Для обновления транзакции
export type UpdateTransaction = Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>;
