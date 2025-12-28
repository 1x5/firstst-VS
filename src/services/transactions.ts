import { supabase } from '@/lib/supabase';
import type { Transaction, NewTransaction, UpdateTransaction } from '@/types/transaction';
import type { Database } from '@/types/supabase';
import { useFinanceStore } from '@/stores/finance';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Преобразование из формата БД в формат приложения
const fromDb = (row: TransactionRow): Transaction => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  category: row.category,
  categoryName: row.category_name,
  description: row.description || '',
  date: row.date,
  isRecurring: row.is_recurring || false,
  recurringInterval: row.recurring_interval,
  currency: row.currency || 'RUB',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Преобразование в формат БД
const toDb = (transaction: NewTransaction | UpdateTransaction, userId: string): TransactionInsert => ({
  user_id: userId,
  type: transaction.type,
  amount: transaction.amount,
  category: transaction.category,
  category_name: transaction.categoryName,
  description: transaction.description || '',
  date: transaction.date,
  is_recurring: transaction.isRecurring || false,
  recurring_interval: transaction.recurringInterval || null,
  currency: transaction.currency || 'RUB',
});

export const transactionsService = {
  // Получить все транзакции пользователя с пагинацией
  async getAll(limit?: number, offset?: number): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (limit !== undefined && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    // Если таблица не существует (42P01), возвращаем пустой массив
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица transactions не существует. Работаем в локальном режиме.');
        return [];
      }
      throw error;
    }
    return (data || []).map(fromDb);
  },

  // Получить количество транзакций
  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  },

  // Получить транзакции за период
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(fromDb);
  },

  // Создать транзакцию
  async create(transaction: NewTransaction, userId: string): Promise<Transaction> {
    const dbData = toDb(transaction, userId);

    // Убеждаемся, что category_name не пустое
    if (!dbData.category_name || dbData.category_name.trim() === '') {
      dbData.category_name = dbData.category || 'Другое';
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(dbData as any)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания транзакции:', error);
      console.error('Данные для вставки:', dbData);
      throw error;
    }
    return fromDb(data);
  },

  // Обновить транзакцию
  async update(id: string, transaction: UpdateTransaction, userId: string): Promise<Transaction> {
    const updateData: Partial<TransactionUpdate> = {};

    if (transaction.type !== undefined) updateData.type = transaction.type;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.category !== undefined) updateData.category = transaction.category;
    if (transaction.categoryName !== undefined) updateData.category_name = transaction.categoryName;
    if (transaction.description !== undefined) updateData.description = transaction.description;
    if (transaction.date !== undefined) updateData.date = transaction.date;
    if (transaction.isRecurring !== undefined) updateData.is_recurring = transaction.isRecurring;
    if (transaction.recurringInterval !== undefined) updateData.recurring_interval = transaction.recurringInterval;
    if (transaction.currency !== undefined) updateData.currency = transaction.currency;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  // Удалить транзакцию
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Подписка на изменения (realtime)
  subscribeToChanges(_userId: string) {
    return supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const financeStore = useFinanceStore.getState();
          const newTransaction = payload.new ? fromDb(payload.new as TransactionRow) : null;
          const oldTransaction = payload.old ? fromDb(payload.old as TransactionRow) : null;

          switch (payload.eventType) {
            case 'INSERT':
              if (newTransaction) {
                financeStore.addTransactionOptimistic(newTransaction);
              }
              break;
            case 'UPDATE':
              if (newTransaction) {
                financeStore.updateTransactionOptimistic(newTransaction.id, newTransaction);
              }
              break;
            case 'DELETE':
              if (oldTransaction) {
                financeStore.removeTransactionOptimistic(oldTransaction.id);
              }
              break;
          }
        }
      )
      .subscribe();
  },
};
