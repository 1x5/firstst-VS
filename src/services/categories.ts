import { supabase } from '@/lib/supabase';
import type { TransactionType } from '@/types/transaction';
import type { Database } from '@/types/supabase';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
}

export type NewCategory = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;

// Дефолтные категории для новых пользователей
export const DEFAULT_CATEGORIES: NewCategory[] = [
  // Доходы
  { name: 'Зарплата', type: 'income' },
  { name: 'Фриланс', type: 'income' },
  { name: 'Инвестиции', type: 'income' },
  { name: 'Подарок', type: 'income' },
  { name: 'Другое', type: 'income' },
  
  // Расходы
  { name: 'Еда', type: 'expense' },
  { name: 'Транспорт', type: 'expense' },
  { name: 'Жильё', type: 'expense' },
  { name: 'Коммуналка', type: 'expense' },
  { name: 'Развлечения', type: 'expense' },
  { name: 'Покупки', type: 'expense' },
  { name: 'Здоровье', type: 'expense' },
  { name: 'Образование', type: 'expense' },
  { name: 'Подписки', type: 'expense' },
  { name: 'Другое', type: 'expense' },
];

// Преобразование из формата БД
const fromDb = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  type: row.type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const categoriesService = {
  // Получить все категории пользователя
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('name');

    // Если таблица не существует (404), возвращаем пустой массив
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Таблица categories не существует. Используем локальные категории.');
        return [];
      }
      throw error;
    }
    return (data || []).map(fromDb);
  },

  // Создать категорию
  async create(category: NewCategory, userId: string): Promise<Category> {
    const insertData: CategoryInsert = {
      user_id: userId,
      name: category.name,
      type: category.type,
    };
    
    const { data, error } = await supabase
      .from('categories')
      .insert(insertData as any)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  // Создать несколько категорий (для инициализации)
  async createMany(categories: NewCategory[], userId: string): Promise<Category[]> {
    const insertData: CategoryInsert[] = categories.map((cat) => ({
      user_id: userId,
      name: cat.name,
      type: cat.type,
    }));
    
    const { data, error } = await supabase
      .from('categories')
      .insert(insertData as any)
      .select();

    if (error) throw error;
    return (data || []).map(fromDb);
  },

  // Обновить категорию
  async update(id: string, name: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({ name } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  // Удалить категорию
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Инициализировать дефолтные категории для нового пользователя
  async initializeDefaults(userId: string): Promise<Category[]> {
    try {
      // Проверяем, есть ли уже категории
      const existing = await this.getAll();
      if (existing.length > 0) {
        return existing;
      }

      // Создаём дефолтные
      return await this.createMany(DEFAULT_CATEGORIES, userId);
    } catch (error) {
      // При любой ошибке возвращаем дефолтные категории локально
      console.warn('Не удалось загрузить категории из Supabase:', error);
      return DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `local-${cat.type}-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }
  },
};

