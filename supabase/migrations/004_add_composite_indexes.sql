-- Добавление составных индексов для оптимизации частых запросов

-- Составной индекс для транзакций: user_id + date + type
-- Используется в запросах с фильтрацией по пользователю, дате и типу
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_type 
ON public.transactions(user_id, date DESC, type);

-- Составной индекс для транзакций: user_id + created_at (для сортировки по дате создания)
-- Используется при загрузке последних транзакций
CREATE INDEX IF NOT EXISTS idx_transactions_user_created 
ON public.transactions(user_id, created_at DESC);

-- Комментарии
COMMENT ON INDEX idx_transactions_user_date_type IS 'Оптимизация запросов с фильтрацией по пользователю, дате и типу транзакции';
COMMENT ON INDEX idx_transactions_user_created IS 'Оптимизация загрузки последних транзакций пользователя';

