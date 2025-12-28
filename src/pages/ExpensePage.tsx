import { useState } from 'react';
import { Plus, Filter, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatsCards } from '@/components/StatsCards';
import { ExpenseChart } from '@/components/ExpenseChart';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';
import { useAuthStore } from '@/stores/auth';
import { ActivityLog } from '@/components/ActivityLog';
import type { Transaction } from '@/types/transaction';

export function ExpensePage() {
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [error, setError] = useState('');

  const user = useAuthStore((state) => state.user);
  const transactions = useFinanceStore((state) => state.transactions) || [];
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  
  const allCategories = useCategoriesStore((state) => state.categories) || [];
  const categories = allCategories.filter((c) => c.type === 'expense');
  const addCategory = useCategoriesStore((state) => state.addCategory);

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const getCategoryName = (categoryId: string) => {
    const cat = allCategories.find((c) => c.id === categoryId);
    return cat?.name || categoryId || 'Другое';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setDate(new Date().toISOString().split('T')[0]);
    setError('');
    setEditingTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(String(transaction.amount));
    setDescription(transaction.description || '');
    setCategory(transaction.category);
    setCategorySearch(transaction.categoryName || getCategoryName(transaction.category));
    setDate(transaction.date);
    setOpen(true); // Открываем форму редактирования внизу страницы
    // Закрываем фильтр и график при открытии редактирования
    setShowFilterPanel(false);
    setShowChart(false);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!user) {
      setError('Необходима авторизация');
      return;
    }

    const amountNum = parseFloat(amount.replace(',', '.'));
    if (!amount || amountNum <= 0) {
      setError('Введите сумму');
      return;
    }

    // Определяем категорию
    let categoryId = category;
    let categoryName = getCategoryName(category);
    
    if (!category && categorySearch.trim()) {
      categoryId = `new-${Date.now()}`;
      categoryName = categorySearch.trim();
    } else if (!category) {
      setError('Выберите категорию');
      return;
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          amount: amountNum,
          category: categoryId,
          categoryName,
          description: description.trim(),
          date,
        }, user.id);
      } else {
        await addTransaction({
          type: 'expense',
          amount: amountNum,
          category: categoryId,
          categoryName,
          description: description.trim(),
          date,
        }, user.id);
      }

      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await removeTransaction(deleteId);
      setDeleteId(null);
      setEditingTransaction(null);
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Ошибка удаления:', err);
    }
  };

  // Группировка по категориям
  const statsByCategory = expenseTransactions.reduce((acc, t) => {
    const catName = getCategoryName(t.category);
    if (!acc[catName]) {
      acc[catName] = { amount: 0, categoryId: t.category };
    }
    acc[catName].amount += t.amount;
    return acc;
  }, {} as Record<string, { amount: number; categoryId: string }>);

  const sortedStats = Object.entries(statsByCategory)
    .map(([name, data]) => ({ name, amount: data.amount, categoryId: data.categoryId }))
    .sort((a, b) => b.amount - a.amount);

  // Фильтрация по периоду
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: now };
      }
      case 'lastMonth': {
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return { start: lastMonthStart, end: lastMonthEnd };
      }
      default:
        return null;
    }
  };

  // Фильтрация транзакций по категории и периоду
  const filteredTransactions = expenseTransactions.filter((t) => {
    // Фильтр по категории
    if (activeFilter !== 'all' && getCategoryName(t.category) !== activeFilter) {
      return false;
    }
    // Фильтр по периоду
    if (periodFilter !== 'all') {
      const range = getDateRange(periodFilter);
      if (range) {
        const txDate = new Date(t.date);
        if (txDate < range.start || txDate > range.end) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col space-y-4 sm:space-y-6">
      <StatsCards />

      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="flex-1 text-lg font-semibold sm:text-xl lg:text-2xl">Расходы</h1>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8',
            showChart && 'bg-foreground text-background hover:bg-foreground hover:text-background'
          )}
          onClick={() => {
            const newShowChart = !showChart;
            setShowChart(newShowChart);
            // Закрываем фильтр при открытии графика
            if (newShowChart) {
              setShowFilterPanel(false);
            }
            // Закрываем режим редактирования при переключении графика
            if (editingTransaction || open) {
              setEditingTransaction(null);
              setOpen(false);
              resetForm();
            }
          }}
          title="Диаграмма расходов"
        >
          <PieChart className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8',
            (showFilterPanel || activeFilter !== 'all' || periodFilter !== 'all') && 'bg-foreground text-background hover:bg-foreground hover:text-background'
          )}
          onClick={() => {
            const newShowFilterPanel = !showFilterPanel;
            setShowFilterPanel(newShowFilterPanel);
            // Закрываем график при открытии фильтра
            if (newShowFilterPanel) {
              setShowChart(false);
            }
            // Закрываем режим редактирования при переключении фильтра
            if (editingTransaction || open) {
              setEditingTransaction(null);
              setOpen(false);
              resetForm();
            }
          }}
          title="Фильтры"
        >
          <Filter className="h-4 w-4" />
        </Button>
        
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs sm:h-9 sm:text-sm"
          onClick={() => {
            if (open) {
              resetForm();
              setOpen(false);
            } else {
              setOpen(true);
              // Закрываем фильтр и график при открытии формы добавления
              setShowFilterPanel(false);
              setShowChart(false);
            }
          }}
        >
          <Plus className={cn('h-4 w-4 transition-transform', open && 'rotate-45')} />
          {open ? 'Закрыть' : 'Добавить'}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="animate-in fade-in duration-200 space-y-3">
          <div className="rounded-lg border bg-card p-3">
            {/* Period Filter */}
            <div className="mb-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Период</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Всё время' },
                  { value: 'week', label: 'Неделя' },
                  { value: 'month', label: 'Этот месяц' },
                  { value: 'lastMonth', label: 'Прошлый месяц' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriodFilter(p.value)}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                      periodFilter === p.value
                        ? 'border-foreground/20 bg-foreground text-background'
                        : 'bg-background hover:bg-muted/50'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category Filter */}
            {sortedStats.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Категория</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={cn(
                      'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                      activeFilter === 'all'
                        ? 'border-foreground/20 bg-foreground text-background'
                        : 'bg-background hover:bg-muted/50'
                    )}
                  >
                    Все
                  </button>
                  {sortedStats.map((stat) => (
                    <button
                      key={stat.name}
                      onClick={() => setActiveFilter(stat.name)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                        activeFilter === stat.name
                          ? 'border-foreground/20 bg-foreground text-background'
                          : 'bg-background hover:bg-muted/50'
                      )}
                    >
                      {stat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Form */}
      {open && (
        <div className="animate-in fade-in duration-200">
          <div className="rounded-lg border bg-card p-3 shadow-sm sm:p-4">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Сумма"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-10 w-1/2 text-sm"
                  autoFocus
                  required
                />
                <Input
                  type="text"
                  placeholder="Описание"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 w-1/2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative w-1/2">
                  <div className="flex gap-1">
                    <Input
                      placeholder="Категория"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setCategory('');
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      className="h-10 w-full text-sm"
                    />
                    {categorySearch.trim() && !categories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase()) && (
                      <Button
                        type="button"
                        size="sm"
                        className="h-10 w-10 p-0"
                        onClick={async () => {
                          const newCatName = categorySearch.trim();
                          if (user && newCatName) {
                            try {
                              await addCategory({ name: newCatName, type: 'expense' }, user.id);
                              const cats = useCategoriesStore.getState().categories;
                              const newCat = cats.find(c => c.name === newCatName && c.type === 'expense');
                              if (newCat) setCategory(newCat.id);
                              setCategorySearch(newCatName);
                              setShowCategoryDropdown(false);
                            } catch (e) {
                              console.error('Ошибка добавления категории:', e);
                              setError('Не удалось добавить категорию');
                            }
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {showCategoryDropdown && (
                    <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                      {categories
                        .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setCategory(cat.id);
                              setCategorySearch(cat.name);
                              setShowCategoryDropdown(false);
                            }}
                            className={cn(
                              'w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent',
                              category === cat.id && 'bg-accent'
                            )}
                          >
                            {cat.name}
                          </button>
                        ))}
                      {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <p className="px-2 py-1 text-xs text-muted-foreground">
                          {categorySearch ? 'Нажмите +' : 'Нет категорий'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 w-1/2 rounded-md border border-input bg-background px-3 text-sm focus:outline-none"
                  required
                />
              </div>
              {error && (
                <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" className="h-9 flex-1 text-xs">
                  {editingTransaction ? 'Сохранить' : 'Добавить расход'}
                </Button>
                {editingTransaction && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9 flex-1 text-xs"
                    onClick={() => {
                      if (editingTransaction) {
                        setDeleteId(editingTransaction.id);
                        setEditingTransaction(null);
                        setOpen(false);
                      }
                    }}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Chart */}
      {showChart && <ExpenseChart />}

      {/* Transactions list */}
      <div className="flex-1 space-y-2">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
          {activeFilter === 'all' ? `Все операции (${filteredTransactions.length})` : `${activeFilter} (${filteredTransactions.length})`}
        </h2>
        <div className="rounded-lg border bg-card">
          {filteredTransactions.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {activeFilter === 'all' ? 'Нет расходов' : 'Нет транзакций в этой категории'}
            </p>
          ) : (
            <div className="divide-y">
              {filteredTransactions.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openEditDialog(t)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-muted/50 sm:gap-3 sm:px-3 sm:py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-medium sm:text-sm">
                        {t.description || t.categoryName || getCategoryName(t.category)}
                      </span>
                      {t.description && (
                        <span className="shrink-0 text-[10px] text-muted-foreground sm:text-xs">
                          · {t.categoryName || getCategoryName(t.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums sm:text-sm">
                    −{formatAmount(t.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить транзакцию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction && !open} onOpenChange={(isOpen) => {
        if (!isOpen) setEditingTransaction(null);
      }}>
        <DialogContent className="max-w-[340px] gap-4 p-4">
          <DialogHeader>
            <DialogTitle>Редактировать расход</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Сумма"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 w-1/2 text-sm"
                autoFocus
                required
              />
              <Input
                type="text"
                placeholder="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 w-1/2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Категория"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="h-10 w-1/2 text-sm"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-1/2 rounded-md border border-input bg-background px-3 text-sm focus:outline-none"
                required
              />
            </div>
            {error && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="h-9 flex-1 text-xs">Сохранить</Button>
              {editingTransaction && (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-9 flex-1 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    if (editingTransaction) {
                      setDeleteId(editingTransaction.id);
                      setEditingTransaction(null);
                      setOpen(false);
                    }
                  }}
                >
                  Удалить
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activity Log - прижат к низу */}
      <ActivityLog type="all" />
    </div>
  );
}
