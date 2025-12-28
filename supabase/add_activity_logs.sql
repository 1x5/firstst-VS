-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ДЛЯ ЛОГОВ ДЕЙСТВИЙ
-- Выполните этот скрипт в SQL Editor Supabase
-- =====================================================

-- Создаём таблицу activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  action TEXT NOT NULL CHECK (action IN ('added', 'updated', 'deleted')),
  amount DECIMAL(12, 2),
  description TEXT,
  category_name TEXT,
  transaction_id TEXT, -- ID транзакции для связи
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_type ON public.activity_logs(user_id, type);

-- Включаем RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
CREATE POLICY "activity_logs_select" ON public.activity_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activity_logs_insert" ON public.activity_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_logs_delete" ON public.activity_logs 
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ГОТОВО! Таблица activity_logs создана
-- =====================================================
