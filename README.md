# Vibe Starter

Стартер для соло вайб-кодера. React + Vite + TypeScript + Tailwind + Supabase + Zustand.

## Быстрый старт

```bash
# Установи зависимости
pnpm install

# Скопируй env
cp .env.example .env.local
# Добавь Supabase ключи в .env.local

# Запусти dev сервер
pnpm dev
```

## Стек

- **React 18** — functional components + hooks
- **Vite** — быстрый dev server и сборка
- **TypeScript** — strict mode
- **Tailwind CSS** — утилитарные классы
- **Shadcn/UI** — готовые компоненты
- **Supabase** — PostgreSQL, Auth, Realtime
- **Zustand** — глобальный стейт
- **TanStack Query** — серверный стейт
- **Netlify** — хостинг

## Команды

```bash
pnpm dev          # Dev сервер на :3000
pnpm build        # Продакшн билд
pnpm preview      # Превью билда
pnpm supabase:types  # Генерация типов из Supabase
```

## Добавление Shadcn компонентов

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

## Supabase

```bash
# Инициализация (один раз)
npx supabase init

# Генерация типов
pnpm supabase:types

# Локальная разработка
npx supabase start
```

## Деплой на Netlify

1. Push в GitHub
2. Подключи репо в Netlify
3. Добавь env переменные в Netlify
4. Готово — автодеплой при каждом пуше

## Структура

```
src/
├── components/ui/   # Shadcn компоненты
├── hooks/           # Кастомные хуки (TanStack Query)
├── lib/             # Утилиты, Supabase клиент
├── stores/          # Zustand сторы
├── types/           # TypeScript типы
└── App.tsx          # Главный компонент
```

