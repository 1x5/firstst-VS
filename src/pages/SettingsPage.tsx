import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sanitizeCategoryName, sanitizeDescription } from '@/lib/sanitize';
import { User, FileText, Download, Upload, Save, RefreshCw, Palette, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/auth';
import { useFinanceStore } from '@/stores/finance';
import { useCategoriesStore } from '@/stores/categories';
import { useAppearanceStore } from '@/stores/appearance';
import { useActivityLogStore } from '@/stores/activityLog';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/translate-error';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const transactions = useFinanceStore((state) => state.transactions) || [];
  const clearFinance = useFinanceStore((state) => state.clearAll);
  const categories = useCategoriesStore((state) => state.categories) || [];
  const clearCategories = useCategoriesStore((state) => state.clearAll);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Appearance
  const { appName, showLogoIcon, setAppName, setShowLogoIcon } = useAppearanceStore();

  // Active section - проверяем параметр section из URL
  const sectionParam = searchParams.get('section') as 'account' | 'data' | 'appearance' | null;
  const [activeSection, setActiveSection] = useState<'account' | 'data' | 'appearance'>(
    sectionParam || 'account'
  );

  // Account state
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [accountError, setAccountError] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // OTP state для подтверждения изменений
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPasswordAfterOTP, setNewPasswordAfterOTP] = useState('');
  const [confirmPasswordAfterOTP, setConfirmPasswordAfterOTP] = useState('');
  const otpInputRef = useRef<HTMLInputElement>(null);
  const newPasswordAfterOTPInputRef = useRef<HTMLInputElement>(null);
  
  // Инициализация полей при загрузке пользователя
  useEffect(() => {
    if (user?.email) {
      setAccountEmail(user.email);
      setAccountPassword(''); // Пароль всегда пустой при загрузке
    }
  }, [user?.email]);
  
  // Проверка, изменились ли данные
  const hasChanges = useMemo(() => {
    const emailChanged = accountEmail.trim() !== (user?.email || '');
    const passwordChanged = accountPassword.trim() !== '';
    return emailChanged || passwordChanged;
  }, [accountEmail, accountPassword, user?.email]);
  
  // Автофокус на поле OTP когда оно появляется
  useEffect(() => {
    if (otpSent && !otpVerified && otpInputRef.current) {
      // Небольшая задержка для плавного появления
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [otpSent, otpVerified]);
  
  // Автофокус на поле нового пароля после отправки OTP
  useEffect(() => {
    if (otpSent && newPasswordAfterOTPInputRef.current) {
      setTimeout(() => {
        newPasswordAfterOTPInputRef.current?.focus();
      }, 150);
    }
  }, [otpSent]);
  
  // Функция для применения изменений после проверки OTP
  const applyAccountChanges = async () => {
    setSavingAccount(true);
    setAccountError('');
    
    try {
      const successMessages: string[] = [];
      
      // Обновление email
      if (accountEmail.trim() !== (user?.email || '')) {
        const redirectUrl = 'https://uchet1.ru/auth/callback';
        const { error } = await supabase.auth.updateUser({
          email: accountEmail.trim(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        
        if (error) {
          throw new Error(translateError(error.message) || 'Ошибка обновления email');
        }
        
        successMessages.push('Письмо подтверждения отправлено на новый email');
      }
      
      // Обновление пароля
      if (accountPassword.trim()) {
        const { updatePassword } = useAuthStore.getState();
        const success = await updatePassword(accountPassword);
        
        if (!success) {
          throw new Error('Ошибка обновления пароля');
        }
        
        successMessages.push('Пароль успешно изменен');
        setAccountPassword(''); // Очищаем пароль после успешного обновления
      }
      
      // Показываем сообщения об успехе
      if (successMessages.length > 0) {
        setAccountMessage(successMessages.join('. '));
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setAccountMessage('');
        }, 5000);
      }
      
      // Сбрасываем состояние OTP
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setNewPasswordAfterOTP('');
      setConfirmPasswordAfterOTP('');
      
      // Обновляем email в состоянии, если он изменился
      if (accountEmail.trim() !== (user?.email || '')) {
        // Email будет обновлен после подтверждения через письмо
      }
    } catch (err: any) {
      setAccountError(translateError(err?.message || 'Ошибка сохранения изменений'));
    } finally {
      setSavingAccount(false);
    }
  };

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

  // Обработка параметра passwordChanged из URL
  useEffect(() => {
    const passwordChanged = searchParams.get('passwordChanged');
    const section = searchParams.get('section');
    
    // Если есть параметр section, устанавливаем активную секцию
    if (section && (section === 'account' || section === 'data' || section === 'appearance')) {
      setActiveSection(section);
    }
    
    // Если пароль был изменен, показываем уведомление
    if (passwordChanged === 'true') {
      setAccountMessage('Пароль успешно изменён!');
      setShowSuccess(true);
      setActiveSection('account');
      
      // Убираем зеленый цвет через 3 секунды
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      // Очищаем сообщение через 5 секунд
      setTimeout(() => {
        setAccountMessage('');
      }, 5000);
      
      // Удаляем параметр из URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('passwordChanged');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

      // Очищаем логи активности
      if (user) {
        await useActivityLogStore.getState().clearLogs(user.id);
      }
      
      // Перезагружаем данные
      await useCategoriesStore.getState().loadCategories(user.id);
      await useFinanceStore.getState().loadTransactions();
      
      // Обновляем текст в редакторе с новыми данными
      // Используем setTimeout чтобы дать время стейтам обновиться через Zustand
      setTimeout(() => {
        // Получаем свежие данные из стейтов
        const freshCategories = useCategoriesStore.getState().categories || [];
        const freshTransactions = useFinanceStore.getState().transactions || [];
        
        // Генерируем текст из свежих данных
        const lines: string[] = [];
        
        lines.push('#КАТЕГОРИИ');
        
        const incomeCategories = freshCategories.filter(c => c.type === 'income' && !c.id.startsWith('default-'));
        if (incomeCategories.length > 0) {
          lines.push('Доход:');
          for (const cat of incomeCategories) {
            lines.push(`-${cat.name}`);
          }
          lines.push('');
        }
        
        const expenseCategories = freshCategories.filter(c => c.type === 'expense' && !c.id.startsWith('default-'));
        if (expenseCategories.length > 0) {
          lines.push('Расход:');
          for (const cat of expenseCategories) {
            lines.push(`-${cat.name}`);
          }
          lines.push('');
        }
        
        lines.push('#ТРАНЗАКЦИИ');
        
        const sortedTransactions = [...freshTransactions].sort((a, b) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );
        
        for (const t of sortedTransactions) {
          const catName = freshCategories.find(c => c.id === t.category)?.name || t.categoryName || t.category;
          const sign = t.type === 'income' ? '+' : '-';
          const amount = t.amount.toLocaleString('ru-RU').replace(/,/g, ' ');
          const date = new Date(t.createdAt || t.date);
          const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          const desc = t.description ? ` ${t.description}` : '';
          lines.push(`${sign}${amount} ${catName}${desc} ${dateStr}`);
        }
        
        setDataText(lines.join('\n'));
      }, 300);
      
      setDataSuccess('БД очищена. Созданы стандартные категории и тестовая транзакция');
      setShowDeleteConfirm(false);
    } catch (err) {
      setDataError(err instanceof Error ? translateError(err.message) : 'Ошибка удаления');
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
    
    if (import.meta.env.DEV) {
      console.log('Starting save...');
    }

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
              const amountStr = amountMatch[1].replace(/\s/g, '');
              const amount = parseFloat(amountStr);
              const rest = beforeDate.slice(amountMatch[0].length).trim();
              const words = rest.split(' ');
              const categoryName = words[0] || 'Другое';
              const description = words.slice(1).join(' ');
              
              // Валидация суммы: проверка на NaN, Infinity и максимальное значение
              if (!isNaN(amount) && isFinite(amount) && amount > 0 && amount <= 999999999999) {
                parsedTransactions.push({
                  type,
                  amount,
                  categoryName: sanitizeCategoryName(categoryName),
                  description: sanitizeDescription(description),
                  date: parseDateTime(dateTime),
                });
              }
            }
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log('Parsed:', { categories: parsedCategories, transactions: parsedTransactions });
      }

      if (parsedCategories.length === 0 && parsedTransactions.length === 0) {
        setDataError('Не найдено данных для сохранения. Проверьте формат.');
        setSavingData(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log('Step 1: Deleting old transactions...');
      }
      // 1. Delete old transactions first (has foreign key to categories)
      const { error: delTxError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);
      
      if (delTxError) {
        if (import.meta.env.DEV) {
          console.error('Delete transactions error:', delTxError);
        }
        throw new Error(`Ошибка удаления транзакций: ${delTxError.message}`);
      }
      if (import.meta.env.DEV) {
        console.log('Step 1: Done');
      }

      if (import.meta.env.DEV) {
        console.log('Step 2: Deleting old categories...');
      }
      // 2. Delete old categories
      const { error: delCatError } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id);
      
      if (delCatError) {
        if (import.meta.env.DEV) {
          console.error('Delete categories error:', delCatError);
        }
        throw new Error(`Ошибка удаления категорий: ${delCatError.message}`);
      }
      if (import.meta.env.DEV) {
        console.log('Step 2: Done');
      }

      if (import.meta.env.DEV) {
        console.log('Step 3: Inserting categories...');
      }
      // 3. Insert categories in batch
      let createdCats: { id: string; name: string; type: string }[] = [];
      if (parsedCategories.length > 0) {
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .insert(parsedCategories.map(c => ({
            user_id: user.id,
            name: sanitizeCategoryName(c.name),
            type: c.type,
          })))
          .select();
        
        if (catError) {
          if (import.meta.env.DEV) {
            console.error('Insert categories error:', catError);
          }
          throw new Error(`Ошибка создания категорий: ${catError.message}`);
        }
        createdCats = catData || [];
        if (import.meta.env.DEV) {
          console.log('Step 3: Created categories:', createdCats.length);
        }
      }

      if (import.meta.env.DEV) {
        console.log('Step 4: Inserting transactions...');
      }
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
          if (import.meta.env.DEV) {
            console.error('Insert transactions error:', txError);
          }
          throw new Error(`Ошибка создания транзакций: ${txError.message}`);
        }
        if (import.meta.env.DEV) {
          console.log('Step 4: Done');
        }
      }

      if (import.meta.env.DEV) {
        console.log('Step 5: Reloading stores...');
      }
      // 5. Reload stores
      await useFinanceStore.getState().loadTransactions();
      await useCategoriesStore.getState().loadCategories(user.id);
      
      if (import.meta.env.DEV) {
        console.log('Step 5: Done. Save complete!');
      }

      setDataSuccess(`✓ ${parsedCategories.length} категорий, ${parsedTransactions.length} транзакций`);
      setTimeout(() => setDataSuccess(''), 5000);
      
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Save error:', err);
      }
      setDataError(err instanceof Error ? translateError(err.message) : 'Ошибка сохранения');
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
          <div className="space-y-4">
            {/* Поле Email */}
            <div className="space-y-2">
              <Label htmlFor="account-email">Email</Label>
              <Input
                id="account-email"
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={savingAccount || otpSent}
              />
            </div>

            {/* Поле Пароль - скрываем после отправки OTP */}
            {!otpSent && (
              <div className="space-y-2">
                <Label htmlFor="account-password">Пароль</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="account-password"
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={savingAccount}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым, если не хотите менять пароль
                </p>
              </div>
            )}

            {/* Кнопка Сохранить */}
            <Button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!hasChanges) {
                  return;
                }

                setAccountError('');
                setAccountMessage('');
                setSavingAccount(true);

                try {
                  // Валидация email
                  if (accountEmail.trim() !== (user?.email || '')) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(accountEmail.trim())) {
                      setAccountError('Некорректный формат email');
                      setSavingAccount(false);
                      return;
                    }
                  }

                  // Валидация пароля
                  if (accountPassword.trim()) {
                    if (accountPassword.length < 8) {
                      setAccountError('Пароль должен быть не менее 8 символов');
                      setSavingAccount(false);
                      return;
                    }
                    if (!/[a-zA-Zа-яА-Я]/.test(accountPassword)) {
                      setAccountError('Пароль должен содержать буквы');
                      setSavingAccount(false);
                      return;
                    }
                    if (!/\d/.test(accountPassword)) {
                      setAccountError('Пароль должен содержать цифры');
                      setSavingAccount(false);
                      return;
                    }
                  }

                  // Отправляем OTP код
                  const emailToUse = accountEmail.trim() || user?.email || '';
                  if (!emailToUse) {
                    setAccountError('Email не указан');
                    setSavingAccount(false);
                    return;
                  }

                  const { sendOTP } = useAuthStore.getState();
                  const success = await sendOTP(emailToUse, 'recovery');

                  if (success) {
                    if (import.meta.env.DEV) {
                      console.log('[SettingsPage] OTP sent successfully, setting otpSent to true');
                    }
                    setOtpCode('');
                    setOtpVerified(false);
                    setOtpSent(true);
                    setAccountMessage('Код отправлен на вашу почту');
                    setShowSuccess(true);
                    setTimeout(() => {
                      setShowSuccess(false);
                      setAccountMessage('');
                    }, 3000);
                    
                    // Проверяем состояние после обновления
                    setTimeout(() => {
                      if (import.meta.env.DEV) {
                        console.log('[SettingsPage] otpSent state after update:', true);
                      }
                    }, 100);
                  } else {
                    setAccountError('Ошибка отправки кода');
                  }
                } catch (err: any) {
                  setAccountError(translateError(err?.message || 'Ошибка отправки кода'));
                } finally {
                  setSavingAccount(false);
                }
              }}
              disabled={!hasChanges || savingAccount || otpSent}
              className="w-full"
            >
              {savingAccount ? 'Отправка кода...' : 'Сохранить'}
            </Button>

            {/* Поля для ввода OTP кода и нового пароля - показываем после нажатия "Сохранить" */}
            {otpSent && !otpVerified && (
              <div className="space-y-4 rounded-md border border-border bg-muted/50 p-4 mt-4">
                {/* Поле для ввода OTP кода */}
                <div className="space-y-2">
                  <Label htmlFor="otp-code" className="text-sm font-medium">
                    Код из письма
                  </Label>
                  <div className="relative">
                    <Input
                      ref={otpInputRef}
                      id="otp-code"
                      type="text"
                      placeholder="Введите 6-значный код"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-11 text-center text-lg tracking-widest"
                      maxLength={6}
                      disabled={savingAccount}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Код отправлен на {accountEmail.trim() || user?.email}
                  </p>
                </div>

                {/* Поле для ввода нового пароля */}
                <div className="space-y-2 border-t border-border pt-3">
                  <Label htmlFor="new-password-after-otp" className="text-sm font-medium">
                    Новый пароль
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={newPasswordAfterOTPInputRef}
                      id="new-password-after-otp"
                      type="password"
                      placeholder="Введите новый пароль"
                      value={newPasswordAfterOTP}
                      onChange={(e) => setNewPasswordAfterOTP(e.target.value)}
                      className="h-11 pl-10"
                      disabled={savingAccount}
                    />
                  </div>
                </div>

                {/* Кнопка для проверки кода и сохранения */}
                <Button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!otpCode || otpCode.length !== 6) {
                      setAccountError('Введите 6-значный код');
                      return;
                    }
                    
                    const emailToUse = accountEmail.trim() || user?.email || '';
                    if (!emailToUse) {
                      setAccountError('Email не указан');
                      return;
                    }
                    
                    // Валидация пароля, если он введен
                    if (newPasswordAfterOTP.trim()) {
                      if (newPasswordAfterOTP.length < 8) {
                        setAccountError('Пароль должен быть не менее 8 символов');
                        return;
                      }
                      if (!/[a-zA-Zа-яА-Я]/.test(newPasswordAfterOTP)) {
                        setAccountError('Пароль должен содержать буквы');
                        return;
                      }
                      if (!/\d/.test(newPasswordAfterOTP)) {
                        setAccountError('Пароль должен содержать цифры');
                        return;
                      }
                    }
                    
                    setSavingAccount(true);
                    setAccountError('');
                    
                    try {
                      const { verifyOTP } = useAuthStore.getState();
                      const success = await verifyOTP(emailToUse, otpCode, 'recovery');
                      
                      if (success) {
                        setOtpVerified(true);
                        // Обновляем accountPassword из нового поля, если пароль введен
                        if (newPasswordAfterOTP.trim()) {
                          setAccountPassword(newPasswordAfterOTP);
                        }
                        // После проверки OTP применяем изменения
                        await applyAccountChanges();
                      } else {
                        setAccountError('Неверный код');
                      }
                    } catch (err: any) {
                      setAccountError(translateError(err?.message || 'Ошибка проверки кода'));
                    } finally {
                      setSavingAccount(false);
                    }
                  }}
                  disabled={savingAccount || !otpCode || otpCode.length !== 6}
                  className="w-full"
                >
                  {savingAccount ? 'Проверка и сохранение...' : 'Проверить код и сохранить'}
                </Button>
              </div>
            )}

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

          {!showDeleteConfirm ? (
            <div className="flex gap-2">
              <Button 
                onClick={saveData} 
                disabled={savingData || !dataText.trim()} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {savingData ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            </div>
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
