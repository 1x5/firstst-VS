import { useState, useRef } from 'react';
import { Plus, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';
import { useAuthStore } from '@/stores/auth';
import type { TransactionType } from '@/types/transaction';

export function TransactionForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((state) => state.user);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const allCategories = useCategoriesStore((state) => state.categories) || [];
  const categories = allCategories.filter((c) => c.type === type);
  
  const filteredCategories = categories.filter((c) => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  const getCategoryName = (categoryId: string) => {
    const cat = allCategories.find((c) => c.id === categoryId);
    return cat?.name || 'Другое';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !user) return;

    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        categoryName: getCategoryName(category),
        description,
        date,
      }, user.id);

      // Reset form
      setAmount('');
      setCategory('');
      setCategorySearch('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowCategoryDropdown(false);
      setOpen(false);
    } catch (error) {
      console.error('Ошибка добавления транзакции:', error);
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType as TransactionType);
    setCategory('');
    setCategorySearch('');
    // Фокус на поле суммы
    setTimeout(() => amountInputRef.current?.focus(), 50);
  };
  
  const handleCategorySelect = (catId: string, catName: string) => {
    setCategory(catId);
    setCategorySearch(catName);
    setShowCategoryDropdown(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg sm:bottom-6 sm:right-6"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[340px] gap-4 p-4 sm:max-w-[400px] sm:p-5">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-base sm:text-lg">Новая транзакция</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="grid h-9 w-full grid-cols-2 sm:h-10">
              <TabsTrigger
                value="expense"
                className="h-8 gap-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background sm:h-9 sm:text-sm"
              >
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Расход
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="h-8 gap-1.5 text-xs data-[state=active]:bg-foreground data-[state=active]:text-background sm:h-9 sm:text-sm"
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Доход
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs sm:text-sm">Сумма</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base text-muted-foreground sm:text-lg">
                ₽
              </span>
              <Input
                ref={amountInputRef}
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 pl-8 text-lg font-semibold sm:h-11 sm:pl-9 sm:text-xl"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Category with search */}
          <div className="relative space-y-1.5">
            <Label className="text-xs sm:text-sm">Категория</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск категории..."
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                  if (!e.target.value) setCategory('');
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                className="h-9 pl-8 text-xs sm:h-10 sm:text-sm"
              />
            </div>
            {showCategoryDropdown && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-auto rounded-md border bg-popover shadow-md">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-xs hover:bg-muted sm:text-sm"
                      onClick={() => handleCategorySelect(cat.id, cat.name)}
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Нет категорий
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs sm:text-sm">Описание</Label>
            <Input
              id="description"
              placeholder="Опционально"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-xs sm:h-10 sm:text-sm"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs sm:text-sm">Дата</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs sm:h-10 sm:text-sm"
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="h-9 w-full text-xs sm:h-10 sm:text-sm"
            disabled={!amount || !category}
          >
            {type === 'income' ? 'Добавить доход' : 'Добавить расход'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
