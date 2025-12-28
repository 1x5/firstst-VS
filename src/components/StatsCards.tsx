import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useFinanceStore, selectTotalIncome, selectTotalExpense } from '@/stores/finance';
import { cn } from '@/lib/utils';

export const StatsCards = memo(function StatsCards() {
  const navigate = useNavigate();
  const location = useLocation();

  const income = useFinanceStore(selectTotalIncome);
  const expense = useFinanceStore(selectTotalExpense);

  const formatAmount = (amount: number, compact = false) => {
    if (compact && Math.abs(amount) >= 10000) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(amount);
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    { id: 'expense', title: 'Расходы', value: expense, path: '/expense', isHome: true, icon: TrendingDown },
    { id: 'income', title: 'Доходы', value: income, path: '/income', isHome: false, icon: TrendingUp },
  ];

  return (
    <div className="grid grid-cols-2 gap-1">
      {stats.map((stat) => {
        const isActive = location.pathname === stat.path || (stat.isHome && location.pathname === '/');
        
        const Icon = stat.icon;
        
        return (
          <button
            key={stat.id}
            onClick={() => navigate(stat.path)}
            className={cn(
              'flex items-center justify-between rounded-md border px-1.5 py-1 text-left transition-all sm:px-2 sm:py-1.5',
              isActive 
                ? 'border-foreground/20 bg-foreground text-background' 
                : 'bg-card hover:bg-muted/50'
            )}
          >
            <div>
              <p className={cn(
                'text-[8px] font-medium uppercase tracking-wide sm:text-[10px]',
                isActive ? 'text-background/60' : 'text-muted-foreground'
              )}>
                {stat.title}
              </p>
              <p
                className={cn(
                  'text-xs font-semibold tabular-nums sm:text-sm lg:text-base',
                  isActive && 'text-background'
                )}
              >
                {formatAmount(stat.value, true)}
              </p>
            </div>
            <Icon className={cn(
              'h-4 w-4 sm:h-5 sm:w-5',
              isActive ? 'text-background/40' : 'text-muted-foreground/50'
            )} />
          </button>
        );
      })}
    </div>
  );
});

