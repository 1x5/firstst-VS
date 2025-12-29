# 🔑 Supabase обновил формат ключей!

## ⚠️ Важно:

Supabase теперь использует новый формат ключей:
- **Publishable key** (`sb_publishable_...`) - новый формат
- **Secret key** (`sb_secret_...`) - новый формат

Но наш код использует **старый формат** (legacy), который начинается с `eyJ`.

## ✅ Решение:

1. В разделе **API Keys** найдите вкладку:
   - **"Legacy anon, service_role API keys"** (вверху страницы)

2. Переключитесь на эту вкладку

3. Там вы найдете:
   - **anon public** - начинается с `eyJ` ✅ (это нужно для `VITE_SUPABASE_ANON_KEY`)
   - **service_role** - начинается с `sb_secret_` ❌ (не используйте)

## 📝 Для GitHub Secrets:

Используйте **anon public** из вкладки "Legacy":
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (из Legacy)

## 🔄 Альтернатива:

Если хотите использовать новые ключи, нужно обновить код, но это сложнее. Лучше использовать Legacy ключи.

