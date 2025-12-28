# 🚀 Быстрая настройка домена для GitHub Pages

## ⚡ Через GitHub CLI (самый быстрый способ)

```bash
# Замените YOUR_DOMAIN.com на ваш домен
gh api repos/1x5/firstst-VS/pages -X PUT \
  -f source[branch]=main \
  -f source[path]=/ \
  -f cname=YOUR_DOMAIN.com
```

Или через веб-интерфейс:
1. https://github.com/1x5/firstst-VS/settings/pages
2. Custom domain → введите ваш домен
3. Save

---

## 📝 Настройка DNS

### Если используете корневой домен (example.com):

Добавьте 4 A записи у регистратора:
```
@ → 185.199.108.153
@ → 185.199.109.153
@ → 185.199.110.153
@ → 185.199.111.153
```

### Если используете www (www.example.com):

Добавьте 1 CNAME запись:
```
www → 1x5.github.io
```

---

## 🔧 Обновить base path (если используете корневой домен)

Если используете корневой домен (example.com), нужно изменить vite.config.ts:

```typescript
base: '/', // Вместо '/firstst-VS/'
```

Я могу это сделать автоматически, если скажете какой домен используете.

---

**Скажите какой домен у вас, и я помогу настроить! 🎯**

