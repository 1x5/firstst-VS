import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories';
import type { Category, NewCategory } from '@/services/categories';

const CATEGORIES_QUERY_KEY = ['categories'] as const;

// Загрузка категорий с кешированием
export function useCategories(userId: string) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, userId],
    queryFn: () => categoriesService.initializeDefaults(userId),
    staleTime: 1000 * 60 * 5, // 5 минут (категории редко меняются)
    gcTime: 1000 * 60 * 10, // 10 минут
  });
}

// Создание категории
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, userId }: { category: NewCategory; userId: string }) => {
      return await categoriesService.create(category, userId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [...CATEGORIES_QUERY_KEY, userId] });
    },
  });
}

// Обновление категории
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, userId }: { id: string; name: string; userId: string }) => {
      return await categoriesService.update(id, name);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [...CATEGORIES_QUERY_KEY, userId] });
    },
  });
}

// Удаление категории
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      await categoriesService.delete(id);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [...CATEGORIES_QUERY_KEY, userId] });
    },
  });
}


