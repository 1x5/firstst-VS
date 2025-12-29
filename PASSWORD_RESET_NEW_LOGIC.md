# 🔄 Новая логика сброса и смены пароля

## 📋 Текущая структура

### Страницы:
- `/` - главная (ExpensePage)
- `/income` - доходы
- `/expense` - расходы
- `/settings` - настройки
- `/auth/reset-password` - сброс пароля (обрабатывается в AuthPage)

### Проблемы текущей реализации:
1. Сложная обработка hash через 404.html
2. Множество проверок и условий
3. Проблемы с редиректами на GitHub Pages
4. Неясная логика обработки recovery токенов

## ✅ Новая упрощенная логика

### 1. Сброс пароля (забыли пароль)

**Шаг 1: Запрос письма**
- Пользователь вводит email на странице `/auth/reset-password`
- Вызывается `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://uchet1.ru/auth/reset-password' })`
- Показывается сообщение "Письмо отправлено"

**Шаг 2: Переход по ссылке из письма**
- Supabase перенаправляет на: `https://uchet1.ru/auth/reset-password#access_token=...&type=recovery&refresh_token=...`
- Если hash есть в URL → обрабатываем сразу
- Если hash потерялся (404) → читаем из sessionStorage (сохранен через 404.html)

**Шаг 3: Установка сессии**
- Парсим hash параметры
- Вызываем `supabase.auth.setSession({ access_token, refresh_token })`
- Если успешно → показываем форму для нового пароля
- Если ошибка → показываем ошибку

**Шаг 4: Обновление пароля**
- Пользователь вводит новый пароль
- Вызываем `supabase.auth.updateUser({ password: newPassword })`
- Если успешно → показываем сообщение об успехе
- Перенаправляем на страницу входа

### 2. Смена пароля (в настройках)

**Шаг 1: Запрос письма**
- Пользователь вводит новый пароль в настройках
- Вызывается `supabase.auth.resetPasswordForEmail(user.email, { redirectTo: 'https://uchet1.ru/auth/reset-password' })`
- Показывается сообщение "Письмо отправлено"

**Шаг 2-4: Аналогично сбросу пароля**

## 🔧 Настройки Supabase

### Redirect URLs (должны быть добавлены):
```
https://uchet1.ru/auth/reset-password
https://uchet1.ru/auth/callback
http://localhost:5173/auth/reset-password
http://localhost:5173/auth/callback
```

### Site URL:
```
https://uchet1.ru
```

## 🚫 Что убрать

1. Сложную логику с множеством проверок hash
2. Дублирование кода обработки recovery токенов
3. Избыточное логирование (оставить только критичное)
4. Проверки `import.meta.env.DEV` для production логов

## ✅ Что оставить

1. Обработку 404 через sessionStorage (для GitHub Pages)
2. Простое логирование для диагностики
3. Обработку ошибок с понятными сообщениями


