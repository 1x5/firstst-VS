# 🔧 Обновление схемы базы данных Supabase

## ⚠️ Проблема

При сохранении транзакции возникает ошибка 400 (Bad Request). Это может быть связано с несоответствием схемы базы данных.

---

## ✅ Решение

### Шаг 1: Откройте SQL Editor в Supabase

1. Зайдите в ваш проект Supabase: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor** (в левом меню)

### Шаг 2: Выполните SQL скрипт

1. Откройте файл `supabase/update_schema.sql` в этом проекте
2. Скопируйте весь содержимое файла
3. Вставьте в SQL Editor в Supabase
4. Нажмите **Run** (или F5)

**⚠️ ВНИМАНИЕ:** Этот скрипт удалит все существующие данные в таблицах `transactions` и `categories`! Если у вас есть важные данные, сначала сделайте экспорт.

---

## 📋 Альтернативный вариант (без удаления данных)

Если вы не хотите терять данные, можно попробовать обновить схему без удаления таблиц:

```sql
-- Проверяем существование колонок
DO $$
BEGIN
  -- Добавляем category_name если его нет
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'category_name'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN category_name TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Обновляем существующие записи
UPDATE public.transactions 
SET category_name = category 
WHERE category_name IS NULL OR category_name = '';
```

---

## 🔍 Проверка схемы

После выполнения скрипта проверьте, что таблицы созданы правильно:

1. В Supabase Dashboard перейдите в **Table Editor**
2. Проверьте, что таблицы `transactions` и `categories` существуют
3. Проверьте структуру таблицы `transactions`:
   - `id` (UUID)
   - `user_id` (UUID)
   - `type` (TEXT)
   - `amount` (DECIMAL)
   - `category` (TEXT)
   - `category_name` (TEXT) ← **Это поле обязательно!**
   - `description` (TEXT)
   - `date` (DATE)
   - `is_recurring` (BOOLEAN)
   - `recurring_interval` (TEXT)
   - `currency` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

---

## ✅ После обновления

1. Обновите страницу приложения
2. Попробуйте создать новую транзакцию
3. Ошибка должна исчезнуть

---

## 🐛 Если ошибка остаётся

1. Откройте консоль браузера (F12)
2. Проверьте детали ошибки в Network tab
3. Убедитесь, что все обязательные поля заполнены:
   - `type` (income/expense)
   - `amount` (> 0)
   - `category` (не пустое)
   - `category_name` (не пустое)
   - `date` (дата)

---

## 📝 Файлы

- `supabase/update_schema.sql` - полный скрипт обновления (удаляет данные)
- `supabase/setup.sql` - оригинальный скрипт настройки

