import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { ActivityLog } from '@/stores/activityLog';

type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

// Преобразование из формата БД в формат приложения
const fromDb = (row: ActivityLogRow): ActivityLog => ({
  id: row.id,
  type: row.type,
  action: row.action,
  amount: row.amount ? Number(row.amount) : undefined,
  description: row.description || undefined,
  categoryName: row.category_name || undefined,
  timestamp: new Date(row.created_at).getTime(),
});

// Преобразование в формат БД
const toDb = (log: Omit<ActivityLog, 'id' | 'timestamp'>, userId: string, transactionId?: string): ActivityLogInsert => ({
  user_id: userId,
  type: log.type,
  action: log.action,
  amount: log.amount || null,
  description: log.description || null,
  category_name: log.categoryName || null,
  transaction_id: transactionId || null,
});

export const activityLogsService = {
  // Получить все логи пользователя
  async getAll(limit?: number): Promise<ActivityLog[]> {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      // Если таблица не существует, возвращаем пустой массив
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица activity_logs не существует. Работаем в локальном режиме.');
        return [];
      }
      throw error;
    }
    return (data || []).map(fromDb);
  },

  // Создать лог
  async create(log: Omit<ActivityLog, 'id' | 'timestamp'>, userId: string, transactionId?: string): Promise<ActivityLog> {
    const dbData = toDb(log, userId, transactionId);

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(dbData as any)
      .select()
      .single();

    if (error) {
      // Если таблица не существует, просто логируем ошибку
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица activity_logs не существует. Лог не сохранен в Supabase.');
        // Возвращаем локальный лог
        return {
          ...log,
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        };
      }
      throw error;
    }
    return fromDb(data);
  },

  // Удалить все логи пользователя
  async deleteAll(userId: string): Promise<void> {
    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('user_id', userId);

    if (error) {
      // Если таблица не существует, просто игнорируем
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица activity_logs не существует.');
        return;
      }
      throw error;
    }
  },
};
