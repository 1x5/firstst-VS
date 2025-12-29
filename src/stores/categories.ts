import { create } from 'zustand';
import type { TransactionType } from '@/types/transaction';
import { categoriesService, DEFAULT_CATEGORIES as SERVICE_DEFAULTS } from '@/services/categories';
import type { Category } from '@/services/categories';

// Локальные дефолтные категории (для оффлайн режима)
export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
}

export const DEFAULT_CATEGORIES: CustomCategory[] = SERVICE_DEFAULTS.map((cat, index) => ({
  ...cat,
  id: `default-${cat.type}-${index}`,
}));

interface CategoriesState {
  categories: CustomCategory[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCategories: (userId: string) => Promise<void>;
  addCategory: (category: Omit<CustomCategory, 'id'>, userId: string) => Promise<CustomCategory>;
  updateCategory: (id: string, name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  clearAll: () => void;
  clearError: () => void;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: DEFAULT_CATEGORIES,
  isLoading: false,
  error: null,
  
  loadCategories: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const categories = await categoriesService.initializeDefaults(userId);
      set({
        categories: categories.length > 0 
          ? categories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              type: cat.type,
            }))
          : DEFAULT_CATEGORIES,
        isLoading: false,
      });
    } catch (error) {
      // При ошибке используем локальные дефолтные (без сообщения об ошибке)
      if (import.meta.env.DEV) {
        console.warn('Используем локальные категории:', error);
      }
      set({
        categories: DEFAULT_CATEGORIES,
        isLoading: false,
      });
    }
  },
  
  addCategory: async (category, userId) => {
    set({ error: null });
    
    try {
      const created = await categoriesService.create(category, userId);
      const newCategory = {
        id: created.id,
        name: created.name,
        type: created.type,
      };
      set((state) => ({
        categories: [...state.categories, newCategory],
      }));
      return newCategory;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка добавления категории';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  updateCategory: async (id, name) => {
    set({ error: null });
    
    const previousCategories = get().categories;
    
    // Оптимистичное обновление
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, name } : c
      ),
    }));
    
    try {
      await categoriesService.update(id, name);
    } catch (error) {
      set({ categories: previousCategories });
      const message = error instanceof Error ? error.message : 'Ошибка обновления';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  removeCategory: async (id) => {
    set({ error: null });
    
    const previousCategories = get().categories;
    
    // Оптимистичное обновление
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
    
    try {
      await categoriesService.delete(id);
    } catch (error) {
      set({ categories: previousCategories });
      const message = error instanceof Error ? error.message : 'Ошибка удаления';
      set({ error: message });
      throw new Error(message);
    }
  },
  
  clearAll: () => {
    set({ categories: DEFAULT_CATEGORIES, error: null });
  },
  
  clearError: () => set({ error: null }),
}));

// Селекторы
export const selectCategoriesByType = (type: TransactionType) => 
  (state: CategoriesState) => state.categories.filter((c) => c.type === type);

export const selectCategoryById = (id: string) =>
  (state: CategoriesState) => state.categories.find((c) => c.id === id);
