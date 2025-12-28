# 🔐 Как добавить Secrets в GitHub

## 📋 Шаг 1: Получить значения из Supabase

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Найдите:
   - **Project URL** — это будет значение для `VITE_SUPABASE_URL`
   - **anon/public key** — это будет значение для `VITE_SUPABASE_ANON_KEY`

**Пример:**
```
VITE_SUPABASE_URL = https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🌐 Способ 1: Через веб-интерфейс GitHub (рекомендуется)

1. Откройте: https://github.com/1x5/firstst-VS/settings/secrets/actions
2. Нажмите **"New repository secret"**
3. Введите:
   - **Name:** `VITE_SUPABASE_URL`
   - **Secret:** вставьте ваш Project URL из Supabase
   - Нажмите **"Add secret"**
4. Повторите для второго секрета:
   - Нажмите **"New repository secret"** снова
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Secret:** вставьте ваш anon key из Supabase
   - Нажмите **"Add secret"**

---

## 💻 Способ 2: Через GitHub CLI (если у вас есть значения)

Если у вас уже есть значения, можете использовать команды:

```bash
# Добавить VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_URL --repo 1x5/firstst-VS --body "ВАШ_URL_ИЗ_SUPABASE"

# Добавить VITE_SUPABASE_ANON_KEY
gh secret set VITE_SUPABASE_ANON_KEY --repo 1x5/firstst-VS --body "ВАШ_КЛЮЧ_ИЗ_SUPABASE"
```

**Важно:** Замените `ВАШ_URL_ИЗ_SUPABASE` и `ВАШ_КЛЮЧ_ИЗ_SUPABASE` на реальные значения!

---

## ✅ Проверка что Secrets добавлены

1. Откройте: https://github.com/1x5/firstst-VS/settings/secrets/actions
2. Вы должны увидеть два секрета:
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`

---

## 🚀 После добавления Secrets

GitHub Actions автоматически запустится при следующем пуше в `main`, или вы можете запустить вручную:

1. Откройте: https://github.com/1x5/firstst-VS/actions
2. Выберите workflow **"Deploy to GitHub Pages"**
3. Нажмите **"Run workflow"** → **"Run workflow"**

---

## 📝 Пример полной команды через CLI

Если у вас есть значения, вот пример:

```bash
# Пример (замените на ваши реальные значения!)
gh secret set VITE_SUPABASE_URL --repo 1x5/firstst-VS --body "https://abcdefghijklmnop.supabase.co"

gh secret set VITE_SUPABASE_ANON_KEY --repo 1x5/firstst-VS --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjM2ODQwMCwiZXhwIjoxOTU3OTQ0NDAwfQ.example"
```

---

**Готово! После добавления Secrets деплой будет работать! 🎉**

