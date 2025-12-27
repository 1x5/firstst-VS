import { useState, useRef, useEffect, useCallback } from 'react';
import { User, FileText, Download, Upload, Eye, EyeOff, Save, RefreshCw, Palette, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';
import { useAppearanceStore } from '@/stores/appearance';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const transactions = useFinanceStore((state) => state.transactions) || [];
  const clearFinance = useFinanceStore((state) => state.clearAll);
  const categories = useCategoriesStore((state) => state.categories) || [];
  const clearCategories = useCategoriesStore((state) => state.clearAll);
  
  // Appearance
  const { appName, showLogoIcon, setAppName, setShowLogoIcon } = useAppearanceStore();

  // Active section
  const [activeSection, setActiveSection] = useState<'account' | 'data' | 'appearance'>('data');

  // Account state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Data editor state
  const [dataText, setDataText] = useState('');
  const [dataError, setDataError] = useState('');
  const [dataSuccess, setDataSuccess] = useState('');
  const [savingData, setSavingData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate text from data
  const generateText = useCallback(() => {
    const lines: string[] = [];
    
    lines.push('#КАТЕГОРИИ');
    
    const incomeCategories = categories.filter(c => c.type === 'income' && !c.id.startsWith('default-'));
    if (incomeCategories.length > 0) {
      lines.push('Доход:');
      for (const cat of incomeCategories) {
        lines.push(`-${cat.name}`);
      }
      lines.push('');
    }
    
    const expenseCategories = categories.filter(c => c.type === 'expense' && !c.id.startsWith('default-'));
    if (expenseCategories.length > 0) {
      lines.push('Расход:');
      for (const cat of expenseCategories) {
        lines.push(`-${cat.name}`);
      }
      lines.push('');
    }
    
    lines.push('#ТРАНЗАКЦИИ');
    
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
    
    for (const t of sortedTransactions) {
      const catName = categories.find(c => c.id === t.category)?.name || t.categoryName || t.category;
      const sign = t.type === 'income' ? '+' : '-';
      const amount = t.amount.toLocaleString('ru-RU').replace(/,/g, ' ');
      const date = new Date(t.createdAt || t.date);
      const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      const desc = t.description ? ` ${t.description}` : '';
      lines.push(`${sign}${amount} ${catName}${desc} ${dateStr}`);
    }
    
    return lines.join('\n');
  }, [categories, transactions]);

  // Auto-load data when switching to data section or when data changes
  useEffect(() => {
    if (activeSection === 'data') {
      setDataText(generateText());
    }
  }, [activeSection, generateText]);

  // Format amount with spaces
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ru-RU').replace(/,/g, ' ');
  };

  // Format date to DD.MM.YY HH:MM
  const formatDateTime = (dateStr: string, createdAtStr?: string) => {
    const date = new Date(createdAtStr || dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  // Refresh data from store
  const refreshData = () => {
    setDataText(generateText());
    setDataError('');
    setDataSuccess('');
  };

  // Parse date from DD.MM.YY HH:MM format
  const parseDateTime = (dateTimeStr: string): string => {
    const match = dateTimeStr.match(/(\d{2})\.(\d{2})\.(\d{2})\s*(\d{2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hours, minutes] = match;
      return `20${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Delete all data
  const deleteAllData = async () => {
    if (!user) return;
    setDeleting(true);
    setDataError('');
    setDataSuccess('');

    try {
      // Удаляем все транзакции пользователя
      const { error: transError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (transError) throw transError;

      // Удаляем все категории пользователя
      const { error: catError } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id);

      if (catError) throw catError;

      // Создаём стандартные категории
      const defaultCategories = [
        { user_id: user.id, name: 'Зарплата', type: 'income' },
        { user_id: user.id, name: 'Фриланс', type: 'income' },
        { user_id: user.id, name: 'Инвестиции', type: 'income' },
        { user_id: user.id, name: 'Еда', type: 'expense' },
        { user_id: user.id, name: 'Транспорт', type: 'expense' },
        { user_id: user.id, name: 'Жильё', type: 'expense' },
        { user_id: user.id, name: 'Развлечения', type: 'expense' },
        { user_id: user.id, name: 'Покупки', type: 'expense' },
        { user_id: user.id, name: 'Здоровье', type: 'expense' },
      ];

      const { data: createdCats, error: createCatError } = await supabase
        .from('categories')
        .insert(defaultCategories)
        .select();

      if (createCatError) throw createCatError;

      // Создаём тестовую транзакцию
      const foodCategory = createdCats?.find(c => c.name === 'Еда');
      const testTransaction = {
        user_id: user.id,
        type: 'expense',
        amount: 500,
        category: foodCategory?.id || 'test',
        category_name: 'Еда',
        description: 'Тестовая транзакция',
        date: new Date().toISOString().split('T')[0],
      };

      const { error: createTransError } = await supabase
        .from('transactions')
        .insert(testTransaction);

      if (createTransError) throw createTransError;

      // Перезагружаем данные
      await useCategoriesStore.getState().loadCategories(user.id);
      await useFinanceStore.getState().loadTransactions();
      
      setDataText('');
      setDataSuccess('БД очищена. Созданы стандартные категории и тестовая транзакция');
      setShowDeleteConfirm(false);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setDeleting(false);
    }
  };

  // Save data from text - using batch insert
  const saveData = async () => {
    if (!user) {
      setDataError('Пользователь не авторизован');
      return;
    }
    
    setSavingData(true);
    setDataError('');
    setDataSuccess('');
    
    console.log('Starting save...');

    try {
      const lines = dataText.split('\n');
      
      let currentCategoryType: 'income' | 'expense' = 'income';
      const parsedCategories: { type: 'income' | 'expense'; name: string }[] = [];
      const parsedTransactions: { type: 'income' | 'expense'; amount: number; categoryName: string; description: string; date: string }[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        if (trimmed.toLowerCase().startsWith('доход')) {
          currentCategoryType = 'income';
          continue;
        }
        if (trimmed.toLowerCase().startsWith('расход')) {
          currentCategoryType = 'expense';
          continue;
        }
        
        // Category: -Name
        if (trimmed.startsWith('-') && !trimmed.match(/^-[\d\s]/)) {
          const name = trimmed.slice(1).trim();
          if (name && !name.match(/^\d/)) {
            parsedCategories.push({ type: currentCategoryType, name });
            continue;
          }
        }
        
        // Transaction: +/-amount Category desc DD.MM.YY HH:MM
        if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
          const type = trimmed.startsWith('+') ? 'income' : 'expense';
          const dateTimeMatch = trimmed.match(/(\d{2}\.\d{2}\.\d{2}\s+\d{2}:\d{2})$/);
          
          if (dateTimeMatch) {
            const dateTime = dateTimeMatch[1];
            const beforeDate = trimmed.slice(1, trimmed.length - dateTime.length).trim();
            const amountMatch = beforeDate.match(/^([\d\s]+)/);
            
            if (amountMatch) {
              const amount = parseFloat(amountMatch[1].replace(/\s/g, ''));
              const rest = beforeDate.slice(amountMatch[0].length).trim();
              const words = rest.split(' ');
              const categoryName = words[0] || 'Другое';
              const description = words.slice(1).join(' ');
              
              if (!isNaN(amount) && amount > 0) {
                parsedTransactions.push({
                  type,
                  amount,
                  categoryName,
                  description,
                  date: parseDateTime(dateTime),
                });
              }
            }
          }
        }
      }

      console.log('Parsed:', { categories: parsedCategories, transactions: parsedTransactions });

      if (parsedCategories.length === 0 && parsedTransactions.length === 0) {
        setDataError('Не найдено данных для сохранения. Проверьте формат.');
        setSavingData(false);
        return;
      }

      console.log('Step 1: Deleting old transactions...');
      // 1. Delete old transactions first (has foreign key to categories)
      const { error: delTxError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);
      
      if (delTxError) {
        console.error('Delete transactions error:', delTxError);
        throw new Error(`Ошибка удаления транзакций: ${delTxError.message}`);
      }
      console.log('Step 1: Done');

      console.log('Step 2: Deleting old categories...');
      // 2. Delete old categories
      const { error: delCatError } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id);
      
      if (delCatError) {
        console.error('Delete categories error:', delCatError);
        throw new Error(`Ошибка удаления категорий: ${delCatError.message}`);
      }
      console.log('Step 2: Done');

      console.log('Step 3: Inserting categories...');
      // 3. Insert categories in batch
      let createdCats: { id: string; name: string; type: string }[] = [];
      if (parsedCategories.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .insert(parsedCategories.map(c => ({
            user_id: user.id,
            name: c.name,
            type: c.type,
          })))
          .select();
        
        if (catError) {
          console.error('Insert categories error:', catError);
          throw new Error(`Ошибка создания категорий: ${catError.message}`);
        }
        createdCats = catData || [];
        console.log('Step 3: Created categories:', createdCats.length);
      }

      console.log('Step 4: Inserting transactions...');
      // 4. Insert transactions in batch
      if (parsedTransactions.length > 0) {
        const txData = parsedTransactions.map(t => {
          const cat = createdCats.find(c => c.name === t.categoryName && c.type === t.type);
          return {
            user_id: user.id,
            type: t.type,
            amount: t.amount,
            category: cat?.id || t.categoryName,
            category_name: t.categoryName,
            description: t.description || null,
            date: t.date,
            is_recurring: false,
            currency: 'RUB',
          };
        });

        const { error: txError } = await supabase
          .from('transactions')
          .insert(txData);
        
        if (txError) {
          console.error('Insert transactions error:', txError);
          throw new Error(`Ошибка создания транзакций: ${txError.message}`);
        }
        console.log('Step 4: Done');
      }

      console.log('Step 5: Reloading stores...');
      // 5. Reload stores
      await useFinanceStore.getState().loadTransactions();
      await useCategoriesStore.getState().loadCategories(user.id);
      
      console.log('Step 5: Done. Save complete!');

      setDataSuccess(`✓ ${parsedCategories.length} категорий, ${parsedTransactions.length} транзакций`);
      setTimeout(() => setDataSuccess(''), 5000);
      
    } catch (err) {
      console.error('Save error:', err);
      setDataError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSavingData(false);
    }
  };

  // Export to file
  const exportToFile = () => {
    const lines: string[] = [];
    lines.push('#КАТЕГОРИИ');
    
    const incCats = categories.filter(c => c.type === 'income' && !c.id.startsWith('default-'));
    if (incCats.length > 0) {
      lines.push('Доход:');
      incCats.forEach(c => lines.push(`-${c.name}`));
      lines.push('');
    }
    
    const expCats = categories.filter(c => c.type === 'expense' && !c.id.startsWith('default-'));
    if (expCats.length > 0) {
      lines.push('Расход:');
      expCats.forEach(c => lines.push(`-${c.name}`));
      lines.push('');
    }
    
    lines.push('#ТРАНЗАКЦИИ');
    const sorted = [...transactions].sort((a, b) => 
      new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
    );
    
    for (const t of sorted) {
      const catName = categories.find(c => c.id === t.category)?.name || t.categoryName;
      const sign = t.type === 'income' ? '+' : '-';
      const desc = t.description ? ` ${t.description}` : '';
      lines.push(`${sign}${formatAmount(t.amount)} ${catName}${desc} ${formatDateTime(t.date, t.createdAt)}`);
    }
    
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `finance-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  // Import from file
  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setDataText(ev.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Update account
  const handleUpdateAccount = async () => {
    setSavingAccount(true);
    setAccountError('');
    setAccountMessage('');

    try {
      if (newEmail.trim()) {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) throw error;
        setAccountMessage('Письмо подтверждения отправлено');
        setNewEmail('');
      }
      
      if (newPassword.trim()) {
        if (newPassword !== confirmPassword) {
          throw new Error('Пароли не совпадают');
        }
        if (newPassword.length < 6) {
          throw new Error('Минимум 6 символов');
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setAccountMessage('Данные обновлены');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with section icons and action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection('account')}
            className={cn(
              'h-9 w-9',
              activeSection === 'account' && 'bg-foreground text-background hover:bg-foreground hover:text-background'
            )}
            title="Аккаунт"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection('data')}
            className={cn(
              'h-9 w-9',
              activeSection === 'data' && 'bg-foreground text-background hover:bg-foreground hover:text-background'
            )}
            title="Данные"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection('appearance')}
            className={cn(
              'h-9 w-9',
              activeSection === 'appearance' && 'bg-foreground text-background hover:bg-foreground hover:text-background'
            )}
            title="Внешний вид"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>

        {activeSection === 'data' && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={refreshData} className="h-9 w-9" title="Обновить">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={exportToFile} className="h-9 w-9" title="Экспорт">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-9 w-9" title="Импорт">
              <Upload className="h-4 w-4" />
            </Button>
            <input ref={fileInputRef} type="file" accept=".txt" onChange={importFromFile} className="hidden" />
          </div>
        )}
      </div>

      {/* Account Section */}
      {activeSection === 'account' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Аккаунт</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-email">Новый email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={user?.email || 'email@example.com'}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Новый пароль</Label>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswords(!showPasswords)} className="h-6 px-2">
                {showPasswords ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            
            <Input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Подтвердите пароль"
            />

            <Button onClick={handleUpdateAccount} disabled={savingAccount} className="w-full">
              {savingAccount ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>

          {accountMessage && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 p-2 text-sm text-green-600 dark:text-green-400">
              {accountMessage}
            </div>
          )}
          {accountError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {accountError}
            </div>
          )}
        </div>
      )}

      {/* Data Section */}
      {activeSection === 'data' && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Редактор БД</h2>
          <Textarea
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
            className="min-h-[450px] font-mono text-xs"
            placeholder="Нажмите 📄 чтобы загрузить данные"
          />

          {dataSuccess && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 p-2 text-sm text-green-600 dark:text-green-400">
              {dataSuccess}
            </div>
          )}
          {dataError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {dataError}
            </div>
          )}

          <Button onClick={saveData} disabled={savingData || !dataText.trim()} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {savingData ? 'Сохранение...' : 'Сохранить'}
          </Button>

          <div className="pt-4 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Удалить все данные
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-destructive font-medium">
                  Вы уверены? Все транзакции и категории будут удалены!
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                    disabled={deleting}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteAllData}
                    className="flex-1 gap-2"
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Удаление...' : 'Удалить'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appearance Section */}
      {activeSection === 'appearance' && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Оформление</h2>
          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="app-name">Название приложения</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Финансы"
            />
          </div>

          {/* Show Logo Icon */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <Label htmlFor="show-icon" className="cursor-pointer">Показывать иконку логотипа</Label>
            <button
              id="show-icon"
              onClick={() => setShowLogoIcon(!showLogoIcon)}
              className={cn(
                'h-6 w-11 rounded-full transition-colors',
                showLogoIcon ? 'bg-foreground' : 'bg-muted'
              )}
            >
              <div className={cn(
                'h-5 w-5 rounded-full bg-background transition-transform',
                showLogoIcon ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
