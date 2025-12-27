import { Trash2, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  filter?: 'all' | 'income' | 'expense';
}

export function TransactionList({ filter = 'all' }: TransactionListProps) {
  const transactions = useFinanceStore((state) => state.transactions) || [];
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const categories = useCategoriesStore((state) => state.categories) || [];

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || 'Другое';
  };

  const filteredTransactions =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Сегодня';
    }
    if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Вчера';
    }

    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center sm:py-8">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Нажмите + чтобы добавить
        </p>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce(
    (groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, typeof filteredTransactions>
  );

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-1.5">
      {sortedDates.map((date) => (
        <div key={date}>
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[10px]">
              {formatDate(date)}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-px">
            {groupedTransactions[date].map((transaction) => (
              <div
                key={transaction.id}
                className="group flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-muted/50"
              >
                {/* Indicator dot */}
                <div
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    transaction.type === 'income'
                      ? 'bg-foreground'
                      : 'bg-muted-foreground/50'
                  )}
                />

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium sm:text-xs">
                    {getCategoryName(transaction.category)}
                    {transaction.description && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        {transaction.description}
                      </span>
                    )}
                  </span>
                </div>

                {/* Amount */}
                <div
                  className={cn(
                    'shrink-0 text-[11px] font-semibold tabular-nums sm:text-xs',
                    transaction.type === 'income'
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '−'}
                  {formatAmount(transaction.amount)}
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeTransaction(transaction.id)}
                >
                  <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
