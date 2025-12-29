# 🚀 Настройка GitHub Pages

## ⚠️ ВАЖНО: Настройте Secrets перед деплоем!

Для успешной сборки необходимо добавить Secrets в настройках репозитория:

1. Откройте: https://github.com/1x5/firstst-VS/settings/secrets/actions
2. Нажмите **"New repository secret"**
3. Добавьте два секрета:

### Secret 1: `VITE_SUPABASE_URL`
```
https://your-project.supabase.co
```

### Secret 2: `VITE_SUPABASE_ANON_KEY`
```
your-anon-key-here
```

## 🔍 Как найти значения

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **API**
4. Скопируйте:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## ✅ Проверка

После добавления secrets:
1. Перейдите в **Actions**: https://github.com/1x5/firstst-VS/actions
2. Найдите последний failed run
3. Нажмите **"Re-run all jobs"** или сделайте новый push

## 📝 Примечание

Если secrets не настроены, сборка будет падать с ошибкой:
```
Missing Supabase environment variables
```

После настройки secrets деплой должен пройти успешно! 🎉

