# ✅ Чеклист настройки Supabase для сброса пароля

## 🔧 Обязательные настройки в Supabase Dashboard

### 1. Site URL
**Путь:** Authentication → URL Configuration → Site URL

```
https://uchet1.ru
```

### 2. Redirect URLs
**Путь:** Authentication → URL Configuration → Redirect URLs

Добавьте следующие URL (каждый с новой строки):

```
https://uchet1.ru/auth/reset-password
https://uchet1.ru/auth/callback
http://localhost:5173/auth/reset-password
http://localhost:5173/auth/callback
```

**⚠️ Важно:** 
- Без завершающего слеша `/` в конце
- Каждый URL на новой строке
- Без пробелов в начале/конце

### 3. Email Templates
**Путь:** Authentication → Email Templates → Reset Password

Убедитесь, что шаблон содержит:
```
{{ .ConfirmationURL }}
```

### 4. Email Settings
**Путь:** Project Settings → Auth

- Проверьте, что включена отправка писем
- Если используете кастомный SMTP, проверьте настройки

## 🧪 Как проверить

1. Откройте консоль браузера (F12)
2. Запросите сброс пароля
3. Проверьте логи:
   - Если видите `redirect_to url is not allowed` → URL не добавлен в Redirect URLs
   - Если письмо не приходит → проверьте папку СПАМ и Rate Limits

## 📝 Текущие URL в коде

- **Reset Password:** `https://uchet1.ru/auth/reset-password`
- **Email Callback:** `https://uchet1.ru/auth/callback`

Эти URL должны быть добавлены в Redirect URLs!

