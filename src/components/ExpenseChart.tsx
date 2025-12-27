import { useMemo } from 'react';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';

interface ChartData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

// Уникальные цвета для категорий
const CATEGORY_COLORS: Record<string, string> = {
  // Расходы
  'Еда': '#ef4444',
  'Транспорт': '#f97316', 
  'Жильё': '#eab308',
  'Коммуналка': '#84cc16',
  'Развлечения': '#22c55e',
  'Покупки': '#14b8a6',
  'Здоровье': '#06b6d4',
  'Образование': '#3b82f6',
  'Подписки': '#8b5cf6',
  'Алкоголь': '#a855f7',
  'Другое': '#6b7280',
  // Доходы
  'Зарплата': '#10b981',
  'Фриланс': '#14b8a6',
  'Инвестиции': '#0ea5e9',
  'Подарок': '#8b5cf6',
};

// Генерация цвета на основе имени категории
const getColorForCategory = (name: string, index: number): string => {
  if (CATEGORY_COLORS[name]) {
    return CATEGORY_COLORS[name];
  }
  // Генерируем цвет на основе хеша имени
  const hue = (name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 37 + index * 60) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

export function ExpenseChart() {
  const transactions = useFinanceStore((state) => state.transactions) || [];
  const categories = useCategoriesStore((state) => state.categories) || [];

  const chartData = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const total = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);

    if (total === 0) return [];

    const byCategory = expenseTransactions.reduce((acc, t) => {
      const cat = categories.find((c) => c.id === t.category);
      const name = cat?.name || t.categoryName || 'Другое';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(byCategory)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
        color: getColorForCategory(name, index),
      }))
      .sort((a, b) => b.amount - a.amount);

    return sorted;
  }, [transactions, categories]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Нет данных для графика</p>
      </div>
    );
  }

  const total = chartData.reduce((acc, d) => acc + d.amount, 0);

  // Создаём градиент для круговой диаграммы
  let cumulativePercentage = 0;
  const gradientStops = chartData.map((d) => {
    const start = cumulativePercentage;
    cumulativePercentage += d.percentage;
    return `${d.color} ${start}% ${cumulativePercentage}%`;
  }).join(', ');

  return (
    <div className="space-y-4">
      {/* Круговая диаграмма */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <div
            className="h-40 w-40 rounded-full sm:h-48 sm:w-48"
            style={{
              background: `conic-gradient(${gradientStops})`,
            }}
          />
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-background sm:inset-6">
            <p className="text-xs text-muted-foreground">Всего</p>
            <p className="text-lg font-bold tabular-nums sm:text-xl">{formatAmount(total)}</p>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="grid gap-2 sm:grid-cols-2">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-2 rounded-lg border bg-card p-2 sm:p-3">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium sm:text-sm">{d.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold tabular-nums sm:text-sm">{formatAmount(d.amount)}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums sm:text-xs">
                {d.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

