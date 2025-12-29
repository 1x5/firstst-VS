-- Создание таблицы логов действий
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  action TEXT NOT NULL CHECK (action IN ('added', 'updated', 'deleted')),
  amount DECIMAL(12, 2),
  description TEXT,
  category_name TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Включаем RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят только свои логи
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать свои логи
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика: пользователи могут удалять свои логи
CREATE POLICY "Users can delete own activity logs"
  ON public.activity_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Комментарии для документации
COMMENT ON TABLE public.activity_logs IS 'Таблица для хранения логов действий пользователей с транзакциями';
COMMENT ON COLUMN public.activity_logs.action IS 'Действие: added (добавлено), updated (обновлено), deleted (удалено)';

