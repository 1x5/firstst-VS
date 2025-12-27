# 📚 Инструкция по Graphite для вашего проекта

## 🎯 Что такое Graphite?
Graphite помогает управлять несколькими PR одновременно (stacked PRs) — создавать маленькие, логически связанные изменения.

---

## 📋 Ваш текущий статус

✅ **PR создан:** `fix-types-and-code-quality`
🔗 **Ссылка:** https://app.graphite.com/submit/1x5/firstst-VS/1
📝 **Статус:** Draft (черновик)

---

## 🚀 Базовые команды Graphite

### 1. Просмотр текущего стека
```bash
gt ls                    # Короткий список веток
gt log                   # Подробная история
```

### 2. Создание нового стека
```bash
gt stack create feature-name    # Создать новый стек
# или
gt create feature-name          # Новый синтаксис
```

### 3. Работа с коммитами
```bash
git add .
git commit -m "feat: добавил функцию X"
# Graphite автоматически отслеживает коммиты
```

### 4. Отправка стека (создание PR)
```bash
gt submit --stack
# или
gt submit --stack --cli   # Только CLI, без открытия браузера
```

### 5. После ревью — автоисправление
```bash
gt stack fix              # Перебазировать и исправить конфликты
gt submit --stack         # Отправить исправления
```

### 6. Синхронизация с main после мерджа
```bash
gt stack sync             # Обновить локальные ветки
gt log                    # Проверить что всё синхронизировано
```

### 7. Удаление стека (если нужно)
```bash
gt delete feature-name    # Удалить ветку
```

---

## 🔄 Типичный workflow

### Создание фичи:
```bash
# 1. Создать стек
gt create add-user-profile

# 2. Сделать изменения, закоммитить
git add .
git commit -m "feat: добавил форму профиля"

# 3. Отправить
gt submit --stack
```

### Self-review (само-ревью):
1. Открыть PR в Graphite UI
2. Проверить изменения
3. Если нужно — исправить локально и `gt submit --stack` снова
4. Опубликовать PR (кнопка "Publish")

### Мердж:
1. В Graphite UI нажать "Merge"
2. Или через CLI: `gt stack sync`

---

## 📖 Ваш текущий PR

### Шаг 1: Опубликовать PR
В Graphite UI нажмите **"Publish"** (вместо "Keep as draft")

### Шаг 2: Проверить изменения
- Откройте файлы в GitHub
- Убедитесь что все `any` типы удалены
- Проверьте что нет ошибок

### Шаг 3: Смержить
После проверки нажмите **"Merge"** в Graphite UI

### Шаг 4: Синхронизировать локально
```bash
gt stack sync
git checkout main
git pull
```

---

## 🆘 Полезные команды

```bash
gt status                 # Статус текущего стека
gt sync                   # Синхронизировать все ветки
gt rebase                 # Перебазировать текущую ветку
gt log short              # Короткий лог
gt log long               # Граф всех веток
gt undo                   # Отменить последнюю операцию
```

---

## 💡 Советы

1. **Маленькие PR** — один PR = одна фича
2. **Осмысленные коммиты** — используйте conventional commits (`feat:`, `fix:`, `refactor:`)
3. **Self-review** — проверяйте свои PR перед мерджем
4. **Синхронизируйтесь** — регулярно делайте `gt stack sync`

---

## 🔗 Дополнительно

- Документация: https://docs.graphite.dev
- Ваш текущий PR: https://app.graphite.com/submit/1x5/firstst-VS/1

