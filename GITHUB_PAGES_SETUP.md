# 🚀 Настройка деплоя на GitHub Pages (Бесплатно!)

## ✅ Что уже сделано

- ✅ Добавлен `base: '/firstst-VS/'` в `vite.config.ts`
- ✅ Создан GitHub Actions workflow (`.github/workflows/deploy.yml`)

---

## 📋 Шаги настройки

### 1. Включить GitHub Pages в репозитории

1. Откройте ваш репозиторий на GitHub: https://github.com/1x5/firstst-VS
2. Перейдите в **Settings** → **Pages** (в левом меню)
3. В разделе **Source** выберите:
   - **Source**: `GitHub Actions`
4. Нажмите **Save**

---

### 2. Добавить Secrets (переменные окружения)

Для работы приложения нужны переменные Supabase:

1. В репозитории перейдите: **Settings** → **Secrets and variables** → **Actions**
2. Нажмите **New repository secret**
3. Добавьте два секрета:

   **Secret 1:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: ваш URL из `.env.local` (например: `https://xxxxx.supabase.co`)

   **Secret 2:**
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: ваш ключ из `.env.local`

---

### 3. Смержить PR в main

Убедитесь что ваш код в ветке `main`:

```bash
# Если вы на ветке fix-types-and-code-quality
git checkout main
git merge fix-types-and-code-quality
git push origin main
```

---

### 4. Деплой произойдёт автоматически! 🎉

После пуша в `main`:
1. GitHub Actions запустится автоматически
2. Соберёт проект
3. Задеплоит на GitHub Pages

**Ваш сайт будет доступен по адресу:**
```
https://1x5.github.io/firstst-VS/
```

---

### 5. Проверить статус деплоя

1. Откройте репозиторий на GitHub
2. Перейдите во вкладку **Actions**
3. Вы увидите процесс сборки и деплоя
4. Когда статус станет зелёным ✅ — сайт готов!

---

## 🔄 Обновление сайта

После каждого пуша в `main` ветку сайт автоматически обновится:

```bash
git add .
git commit -m "feat: добавил новую функцию"
git push origin main
# GitHub Actions автоматически задеплоит изменения
```

---

## 🐛 Решение проблем

### Сайт не работает / показывает 404

1. Проверьте что в `vite.config.ts` указан правильный `base: '/firstst-VS/'`
2. Убедитесь что GitHub Pages включён в Settings → Pages
3. Проверьте логи в Actions → ваш workflow → Run

### Ошибки при сборке

1. Проверьте что Secrets добавлены правильно
2. Проверьте логи сборки в Actions
3. Убедитесь что `pnpm build` работает локально

### Переменные окружения не работают

- Secrets должны называться **точно** так же: `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- После добавления Secrets перезапустите workflow (Actions → ваш workflow → Re-run)

---

## 📝 Важные замечания

1. **GitHub Pages — только для статических сайтов** ✅ (ваш React app подходит)
2. **Бесплатно** — неограниченное количество репозиториев
3. **Автоматический деплой** — при каждом пуше в `main`
4. **HTTPS** — автоматически включён
5. **Кастомный домен** — можно настроить (Settings → Pages → Custom domain)

---

## 🎯 Альтернативы (если GitHub Pages не подходит)

Согласно `.cursorrules`, вы также можете использовать **Netlify** (тоже бесплатно):

1. Зарегистрируйтесь на https://netlify.com
2. Подключите репозиторий GitHub
3. Настройте автодеплой
4. Добавьте env переменные в Netlify Dashboard

---

## ✅ Готово!

После выполнения всех шагов ваш сайт будет доступен бесплатно на GitHub Pages! 🚀

