# 🔑 Как найти правильные ключи Supabase

## ❌ НЕПРАВИЛЬНЫЕ ключи:

- ❌ `sb_secret_...` - это **service_role** key (секретный, НЕ для клиента!)
- ❌ `sb_publishable_...` - это не стандартный формат Supabase

## ✅ ПРАВИЛЬНЫЙ ключ:

**Anon public key** должен начинаться с `eyJ` (это JWT токен)

Пример: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.xxxxx`

## 📍 Где найти:

1. Откройте **Supabase Dashboard**: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. В разделе **Project API keys** найдите:

### ✅ Anon public (для клиента)
- Название: **"anon"** или **"public"**
- Начинается с: `eyJ`
- Используйте этот для `VITE_SUPABASE_ANON_KEY`

### ❌ Service role (НЕ используйте!)
- Название: **"service_role"**
- Начинается с: `sb_secret_`
- ⚠️ НИКОГДА не используйте на клиенте!

## 🔍 Как проверить:

Правильный anon key:
- ✅ Начинается с `eyJ`
- ✅ Это JWT токен (можно декодировать на jwt.io)
- ✅ Безопасен для использования на клиенте

Неправильный ключ:
- ❌ Начинается с `sb_secret_` или `sb_publishable_`
- ❌ Это секретный ключ

## 📝 Для GitHub Secrets:

Добавьте в Secrets:
- `VITE_SUPABASE_URL`: `https://xxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon public key)

