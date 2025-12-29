#!/bin/bash

# Скрипт для деплоя на GitHub Pages

echo "🔨 Сборка проекта..."
pnpm build

echo "📦 Добавление изменений в git..."
git add -A

echo "💾 Создание коммита..."
git commit -m "feat: обновлен раздел аккаунт с OTP подтверждением" || echo "Нет изменений для коммита"

echo "🚀 Отправка в репозиторий..."
git push origin main || git push origin master || echo "Ошибка при отправке"

echo "✅ Деплой завершен! Проверьте GitHub Actions для статуса деплоя."

