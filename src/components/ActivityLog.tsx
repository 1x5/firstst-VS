import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActivityLogStore, type ActivityLog } from '@/stores/activityLog';
import { cn } from '@/lib/utils';

interface ActivityLogProps {
  type: 'income' | 'expense' | 'all';
}

const actionLabels = {
  added: 'Добавлено',
  updated: 'Изменено',
  deleted: 'Удалено',
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  if (days < 7) return `${days} дн назад`;
  
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ActivityLog = memo(function ActivityLog({ type }: ActivityLogProps) {
  const [expanded, setExpanded] = useState(false);
  const logs = useActivityLogStore((state) => state.getLogsByType(type));
  const visibleLogs = expanded ? logs.slice(0, 13) : logs.slice(0, 3);
  const hasMore = logs.length > 3;

  // Отображаем блок даже если логов нет, чтобы пользователь видел, что функционал работает
  // Но показываем только заголовок без содержимого
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-2">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Последние действия
          </h3>
        </div>
        <div className="py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Нет действий</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Последние действия
        </h3>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 gap-0.5 px-1.5 text-[10px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-2.5 w-2.5" />
                Свернуть
              </>
            ) : (
              <>
                <ChevronDown className="h-2.5 w-2.5" />
                Все ({logs.length})
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-0.5">
        {visibleLogs.map((log) => (
          <ActivityLogItem key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
});

const ActivityLogItem = memo(function ActivityLogItem({ log }: { log: ActivityLog }) {
  const actionLabel = actionLabels[log.action];
  const isPositive = log.type === 'income';
  const isDeleted = log.action === 'deleted';

  return (
    <div className="flex items-center justify-between gap-1.5 rounded-sm px-1.5 py-0.5 text-[10px] hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className={cn(
            'shrink-0 font-medium',
            isDeleted ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {actionLabel}
          </span>
          {log.description && (
            <span className="truncate text-muted-foreground">
              {log.description}
            </span>
          )}
          {log.categoryName && (
            <span className="shrink-0 text-muted-foreground">
              · {log.categoryName}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {log.amount !== undefined && (
          <span className={cn(
            'font-semibold tabular-nums text-[10px]',
            isDeleted 
              ? 'text-muted-foreground line-through' 
              : isPositive 
                ? 'text-green-600 dark:text-green-500' 
                : 'text-red-600 dark:text-red-500'
          )}>
            {isPositive ? '+' : '-'}{formatAmount(log.amount)}
          </span>
        )}
        <span className="text-[9px] text-muted-foreground">
          {formatTime(log.timestamp)}
        </span>
      </div>
    </div>
  );
});

