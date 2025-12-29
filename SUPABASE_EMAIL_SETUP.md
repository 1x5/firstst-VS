# 🔧 Настройка отправки писем в Supabase

## Проблема: Письма восстановления пароля не приходят

Если письма восстановления пароля не приходят, проверьте настройки в Supabase Dashboard.

## ⚠️ ВАЖНО: Проверьте консоль браузера!

Откройте консоль (F12 → Console) и попробуйте отправить письмо. Вы увидите подробные логи с префиксом `[resetPassword]` или `[SettingsPage]`, которые покажут точную причину проблемы.

## ✅ Решение

### 1. Проверьте Site URL

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **Authentication** → **URL Configuration**
4. Убедитесь, что **Site URL** установлен:
   ```
   https://uchet1.ru
   ```

### 2. Добавьте Redirect URLs

В том же разделе **URL Configuration**, добавьте следующие URL в **Redirect URLs**:

```
https://uchet1.ru/auth/reset-password
https://uchet1.ru/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/callback
```

**Важно:** Добавьте URL без завершающего слеша `/` в конце!

### 3. Проверьте Email Templates

1. Перейдите в **Authentication** → **Email Templates**
2. Убедитесь, что шаблон **Reset Password** активен
3. Проверьте, что шаблон содержит переменную `{{ .ConfirmationURL }}`

### 4. Проверьте Email Settings

1. Перейдите в **Project Settings** → **Auth**
2. Убедитесь, что включен **Enable Email Confirmations** (если используется)
3. Проверьте настройки **SMTP** (если используете кастомный SMTP)

### 5. Проверьте Rate Limits

Supabase имеет лимиты на отправку писем:
- Бесплатный план: до 4 писем в час на пользователя
- Если превышен лимит, письма не будут отправляться

### 6. Проверьте логи в Supabase

1. Перейдите в **Logs** → **Auth Logs**
2. Найдите записи о попытках отправки писем
3. Проверьте, есть ли ошибки

### 7. Проверьте спам

- Проверьте папку "Спам" или "Нежелательная почта"
- Проверьте, что ваш email не блокирует письма от Supabase

## 🔍 Диагностика

Если письма всё ещё не приходят, проверьте в консоли браузера:

1. Откройте DevTools (F12)
2. Перейдите на вкладку Console
3. Попробуйте отправить письмо для восстановления пароля
4. Проверьте, есть ли ошибки в консоли

Ожидаемая ошибка, если URL не добавлен:
```
"redirect_to url is not allowed"
```

## 📝 Текущие настройки в коде

В коде используется:
- **Reset Password URL:** `https://uchet1.ru/auth/reset-password`
- **Email Callback URL:** `https://uchet1.ru/auth/callback`

Убедитесь, что оба этих URL добавлены в **Redirect URLs** в Supabase Dashboard!

