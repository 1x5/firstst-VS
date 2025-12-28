# ✅ Финальные шаги для деплоя (2 минуты)

## 🎉 Что уже сделано автоматически:

✅ Workflow файл создан и запушен  
✅ vite.config.ts настроен с правильным base path  
✅ Код отправлен в main ветку

---

## 🔧 Осталось сделать ВРУЧНУЮ (через веб-интерфейс GitHub):

### Шаг 1: Включить GitHub Pages (30 секунд)

1. Откройте: https://github.com/1x5/firstst-VS/settings/pages
2. В разделе **"Source"** выберите: **"GitHub Actions"**
3. Нажмите **"Save"**

---

### Шаг 2: Добавить Secrets для Supabase (1 минута)

**Важно:** Без этих переменных приложение не будет работать!

1. Откройте: https://github.com/1x5/firstst-VS/settings/secrets/actions
2. Нажмите **"New repository secret"**

**Добавьте первый секрет:**
- **Name:** `VITE_SUPABASE_URL`
- **Secret:** ваш URL из файла `.env.local` (например: `https://xxxxx.supabase.co`)
- Нажмите **"Add secret"**

**Добавьте второй секрет:**
- Нажмите **"New repository secret"** снова
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Secret:** ваш ключ из файла `.env.local`
- Нажмите **"Add secret"**

---

### Шаг 3: Проверить что деплой запустился (30 секунд)

1. Откройте: https://github.com/1x5/firstst-VS/actions
2. Должен быть запущен workflow **"Deploy to GitHub Pages"**
3. Подождите пока он завершится (зелёная галочка ✅)

---

### Шаг 4: Ваш сайт готов! 🚀

После завершения деплоя ваш сайт будет доступен по адресу:

**https://1x5.github.io/firstst-VS/**

---

## 🐛 Если что-то не работает:

### Workflow не запускается?
- Проверьте что GitHub Pages включён (Шаг 1)
- Убедитесь что вы пушили в `main` ветку

### Ошибка при сборке?
- Проверьте что Secrets добавлены правильно (Шаг 2)
- Убедитесь что имена секретов точно: `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`

### Сайт показывает 404?
- Подождите 1-2 минуты (Pages иногда обновляется с задержкой)
- Проверьте что base path в vite.config.ts правильный: `/firstst-VS/`

---

## 📝 Быстрые ссылки:

- Настройки Pages: https://github.com/1x5/firstst-VS/settings/pages
- Secrets: https://github.com/1x5/firstst-VS/settings/secrets/actions
- Actions (логи деплоя): https://github.com/1x5/firstst-VS/actions
- Ваш сайт: https://1x5.github.io/firstst-VS/ (после деплоя)

---

**Всё готово! Выполните 2 шага выше и ваш сайт будет работать! 🎉**

