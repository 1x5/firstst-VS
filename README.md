# 💰 Финансы — Учёт доходов и расходов

Веб-приложение для учёта личных финансов, построенное по **Solo Vibe Coder Stack 2025**.

## 🎯 Стек проекта

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.3+ | UI фреймворк (functional components + hooks) |
| Vite | 5.4+ | Сборка, HMR, dev server |
| TypeScript | 5.5+ | Типизация (strict mode) |
| Tailwind CSS | 3.4+ | Стилизация |
| Shadcn/UI | — | UI компоненты |
| Zustand | 4.5+ | State management с persist |
| Supabase | 2.45+ | PostgreSQL, Auth, RLS |
| TanStack Query | 5.51+ | Серверный стейт |

## ✨ Возможности

- 📊 **Статистика** — баланс, доходы, расходы, сбережения
- ➕ **Добавление транзакций** — форма с категориями
- 🗂️ **15+ категорий** — для доходов и расходов
- 🔍 **Фильтрация** — все / доходы / расходы
- 📅 **Группировка** — история по датам
- 🌙 **Dark mode** — через Tailwind `dark:`
- 💾 **Persist** — данные сохраняются в localStorage
- 📱 **Mobile-first** — адаптивный дизайн

## 🚀 Быстрый старт

```bash
# Установка (pnpm, не npm!)
pnpm install

# Dev server
pnpm dev

# Открыть http://localhost:3000
```

## 📁 Структура проекта

```
src/
├── components/
│   ├── ui/                    # Shadcn/UI компоненты
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── badge.tsx
│   ├── StatsCards.tsx         # Карточки статистики
│   ├── TransactionForm.tsx    # Форма добавления
│   └── TransactionList.tsx    # Список транзакций
├── stores/
│   └── finance.ts             # Zustand store
├── types/
│   ├── supabase.ts            # Типы Supabase
│   └── transaction.ts         # Типы транзакций
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── utils.ts               # cn() утилита
├── App.tsx
└── main.tsx
supabase/
└── migrations/
    └── 001_create_transactions.sql  # RLS миграция
```

## 🎨 Категории

### Доходы
| Иконка | Категория |
|--------|-----------|
| 💰 | Зарплата |
| 💻 | Фриланс |
| 📈 | Инвестиции |
| 🎁 | Подарок |
| ✨ | Другое |

### Расходы
| Иконка | Категория |
|--------|-----------|
| 🍔 | Еда |
| 🚗 | Транспорт |
| 🏠 | Жильё |
| 💡 | Коммуналка |
| 🎮 | Развлечения |
| 🛍️ | Покупки |
| 💊 | Здоровье |
| 📚 | Образование |
| 📱 | Подписки |
| 📦 | Другое |

## 🗄️ Supabase интеграция

### Настройка

1. Создай проект на [supabase.com](https://supabase.com)
2. Скопируй переменные в `.env.local`:

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

3. Примени миграцию:

```bash
npx supabase db push
```

### RLS политики

Таблица `transactions` защищена RLS:
- ✅ SELECT — только свои записи
- ✅ INSERT — только свои записи
- ✅ UPDATE — только свои записи
- ✅ DELETE — только свои записи

## 🔧 Команды

```bash
# Разработка
pnpm dev

# Сборка
pnpm build

# Превью production
pnpm preview

# Генерация типов Supabase
pnpm supabase:types

# Lint
pnpm lint
```

## 📝 Git конвенции

```bash
# Conventional commits
feat: добавил фильтрацию по месяцам
fix: исправил баг с суммой
refactor: переписал StatsCards
chore: обновил зависимости
```

## ⚠️ Важно

1. **Используй pnpm** — не npm
2. **Supabase RLS** — все таблицы защищены
3. **Env переменные** — `VITE_*` для клиента
4. **TypeScript** — никакого `any`

## 📄 Лицензия

MIT © 2025
