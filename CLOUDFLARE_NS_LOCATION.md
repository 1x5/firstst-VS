# 📍 Где найти NS серверы в Cloudflare

## 🎯 После добавления домена в Cloudflare

После того как вы добавили домен `uchet1.ru` в Cloudflare, вам покажут NS серверы на **нескольких этапах**:

---

## 📋 Способ 1: При добавлении домена (самый очевидный)

1. Зайдите на https://dash.cloudflare.com
2. Нажмите **"Add a Site"** (или **"Добавить сайт"**)
3. Введите `uchet1.ru`
4. Выберите план **Free**
5. Нажмите **"Continue"**

**Cloudflare покажет вам страницу с заголовком:**

### **"Update your nameservers"** или **"Обновите ваши серверы имен"**

На этой странице вы увидите **2 NS сервера**, например:
```
ben.ns.cloudflare.com
sue.ns.cloudflare.com
```

**Или другие, например:**
```
ella.ns.cloudflare.com
rico.ns.cloudflare.com
```

**⚠️ ВАЖНО:** Запишите эти серверы! Они понадобятся для изменения NS у регистратора.

---

## 📋 Способ 2: В Dashboard после добавления домена

Если вы уже добавили домен:

1. Зайдите на https://dash.cloudflare.com
2. Выберите ваш домен `uchet1.ru` из списка
3. В правой колонке (sidebar) найдите раздел **"Overview"** (Обзор)
4. Прокрутите вниз до раздела **"Quick Actions"** или **"Быстрые действия"**
5. Там будет блок с заголовком **"Update your nameservers"** или **"Обновите ваши серверы имен"**
6. Там указаны 2 NS сервера

---

## 📋 Способ 3: В разделе DNS (если домен уже активен)

Если домен уже активен и NS серверы изменены:

1. Зайдите на https://dash.cloudflare.com
2. Выберите домен `uchet1.ru`
3. Перейдите в раздел **"DNS"** (слева в меню)
4. В самом верху страницы будет информация о NS серверах

**Или:**

1. Зайдите на https://dash.cloudflare.com
2. Выберите домен `uchet1.ru`
3. Перейдите в **"Overview"** (Обзор)
4. Прокрутите вниз до раздела **"DNS"**
5. Там будут показаны NS серверы

---

## 📋 Способ 4: Через API (для технических пользователей)

```bash
# Установите Cloudflare CLI (если нужно)
# Или используйте curl:
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

Но проще использовать веб-интерфейс.

---

## 🎯 Самый простой способ:

1. Зайдите в Dashboard Cloudflare: https://dash.cloudflare.com
2. Если домен ещё не добавлен — добавьте его, и NS серверы покажут сразу
3. Если домен уже добавлен — выберите его, и NS серверы будут в Overview или DNS разделе

---

## ⚠️ Важно помнить:

- Cloudflare всегда даёт **2 NS сервера**
- Они выглядят как: `имя.ns.cloudflare.com`
- У каждого домена свои уникальные NS серверы
- Их нужно изменить у регистратора домена

---

## 📝 Пример того, что вы увидите:

```
Update your nameservers

Replace the nameservers at your registrar with:

1. ben.ns.cloudflare.com
2. sue.ns.cloudflare.com

Please note that it may take up to 24 hours for your nameservers to 
propagate after you make this change.
```

---

**Именно эти 2 сервера нужно ввести у регистратора домена в поля NameServer 1 и NameServer 2! 🎯**

