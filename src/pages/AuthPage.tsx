import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';
import { translateError } from '@/lib/translate-error';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(() => {
    // Восстанавливаем состояние из sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('passwordUpdated') === 'true';
    }
    return false;
  });

  const { signIn, signUp, resetPassword, updatePassword, isLoading, error, clearError } = useAuthStore();
  
  // Восстанавливаем режим reset из sessionStorage при монтировании
  useEffect(() => {
    if (location.pathname.includes('/auth/reset-password') && passwordUpdated) {
      setMode('reset');
    }
  }, [location.pathname, passwordUpdated]);
  

  // Упрощенная обработка callback от Supabase для reset password
  useEffect(() => {
    // Обрабатываем только на странице reset-password
    if (!location.pathname.includes('/auth/reset-password')) {
      return;
    }

    // Добавляем небольшую задержку, чтобы убедиться, что sessionStorage уже заполнен
    const timeoutId = setTimeout(() => {
      handleResetPasswordCallback();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.hash]);

  const handleResetPasswordCallback = async () => {
    console.log('[reset-password] ===== CALLBACK HANDLING START =====');
    console.log('[reset-password] Current pathname:', location.pathname);
    
    // Получаем hash из разных источников (приоритет: window.location > location.hash > sessionStorage)
    const hashFromWindow = typeof window !== 'undefined' ? window.location.hash : null;
    const hashFromUrl = location.hash;
    const hashFromStorage = typeof window !== 'undefined' 
      ? sessionStorage.getItem('_reset_password_hash')
      : null;
    
    console.log('[reset-password] Hash sources:', {
      fromWindow: hashFromWindow ? 'yes (' + hashFromWindow.substring(0, 30) + '...)' : 'no',
      fromUrl: hashFromUrl ? 'yes (' + hashFromUrl.substring(0, 30) + '...)' : 'no',
      fromStorage: hashFromStorage ? 'yes (' + hashFromStorage.substring(0, 30) + '...)' : 'no'
    });
    
    const hashToProcess = hashFromWindow || hashFromUrl || (hashFromStorage ? `#${hashFromStorage}` : null);
    
    if (!hashToProcess) {
      console.warn('[reset-password] No hash found in any source');
      return; // Нет hash - ничего не делаем
    }
    
    console.log('[reset-password] Processing hash...');

      try {
        // Парсим hash параметры
        const hashString = hashToProcess.startsWith('#') ? hashToProcess.substring(1) : hashToProcess;
        const hashParams = new URLSearchParams(hashString);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        // Обработка ошибок в URL
        if (error) {
          setLocalError(translateError(errorDescription || error) || 'Ошибка обработки ссылки');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          return;
        }
        
        // Если есть access_token, устанавливаем сессию
        if (accessToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            setLocalError(translateError(sessionError.message) || 'Ссылка недействительна или истекла');
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return;
          }

          if (sessionData?.session) {
            console.log('[reset-password] Session set successfully, setting mode to reset');
            setMode('reset');
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('_reset_password_hash');
            }
            console.log('[reset-password] ===== CALLBACK HANDLING SUCCESS =====');
          } else {
            console.error('[reset-password] Session data is missing');
            setLocalError('Не удалось установить сессию');
          }
        } else {
          console.warn('[reset-password] No access_token in hash');
          setLocalError('Ссылка для сброса пароля недействительна');
        }
      } catch (err) {
        console.error('[reset-password] Error handling callback:', err);
        setLocalError('Ошибка обработки ссылки');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    handleResetPasswordCallback();
  }, [location.pathname, location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'forgot') {
      if (!email) {
        setLocalError('Введите email');
        return;
      }
      const success = await resetPassword(email);
      if (success) {
        setResetSent(true);
      }
      return;
    }

    if (mode !== 'reset' && !email) {
      setLocalError('Введите email');
      return;
    }

    // Для входа не нужна валидация пароля - Supabase сам проверит
    if (mode === 'login') {
      if (!password) {
        setLocalError('Введите пароль');
        return;
      }
      // Прямой вызов signIn без дополнительной валидации
      const success = await signIn(email, password);
      if (success) {
        // После успешного входа редирект произойдет автоматически через onAuthStateChange
        // Но можно также явно перенаправить на главную
        navigate('/', { replace: true });
      }
      return;
    }

    if (!password) {
      setLocalError('Введите пароль');
      return;
    }

    // Улучшенная валидация пароля (только для register и reset)
    if (mode === 'register' || mode === 'reset') {
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают');
        return;
      }

      if (password.length < 8) {
        setLocalError('Пароль должен быть не менее 8 символов');
        return;
      }
      
      // Проверка сложности пароля
      if (!/[a-zA-Zа-яА-Я]/.test(password)) {
        setLocalError('Пароль должен содержать буквы');
        return;
      }
      
      if (!/\d/.test(password)) {
        setLocalError('Пароль должен содержать цифры');
        return;
      }
    }

    if (mode === 'register') {
      await signUp(email, password);
    } else if (mode === 'reset') {
      const success = await updatePassword(password);
      if (success) {
        setPasswordUpdated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('passwordUpdated', 'true');
        }
      }
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setLocalError('');
    setResetSent(false);
  };

  const displayError = localError || error;

  // Экран успешного обновления пароля
  if (mode === 'reset' && passwordUpdated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Пароль успешно изменён!</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ваш пароль был успешно изменён. Теперь вы можете войти в систему с новым паролем.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Button
              onClick={async () => {
                // Выходим из recovery сессии и переходим на страницу входа
                await useAuthStore.getState().signOut();
                setMode('login');
                setPasswordUpdated(false);
                // Очищаем sessionStorage
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('passwordUpdated');
                }
                navigate('/');
              }}
              className="w-full"
            >
              Войти с новым паролем
            </Button>
            <p className="text-xs text-muted-foreground">
              Вы будете перенаправлены на страницу входа
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Экран успешной отправки письма
  if (mode === 'forgot' && resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10">
              <CheckCircle className="h-7 w-7 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Письмо отправлено</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Мы отправили ссылку для сброса пароля на {email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => switchMode('login')}
          >
            Вернуться ко входу
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Учёт доходов и расходов</h1>
          {mode === 'forgot' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Восстановление пароля
            </p>
          )}
          {mode === 'reset' && (
            <p className="mt-1 text-sm text-muted-foreground">
              Введите новый пароль
            </p>
          )}
        </div>


        {/* Back button for forgot and reset modes */}
        {(mode === 'forgot' || mode === 'reset') && (
          <button
            onClick={() => {
              if (mode === 'reset') {
                navigate('/');
              } else {
                switchMode('login');
              }
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад ко входу
          </button>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {(mode !== 'forgot' && mode !== 'reset') && (
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm">
                Пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'reset') && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm">
                Подтвердите пароль
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {displayError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {displayError}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'login' ? 'Вход...' : mode === 'register' ? 'Регистрация...' : 'Отправка...'}
              </>
            ) : mode === 'login' ? (
              'Войти'
            ) : mode === 'register' ? (
              'Зарегистрироваться'
            ) : mode === 'reset' ? (
              'Обновить пароль'
            ) : (
              'Отправить ссылку'
            )}
          </Button>
        </form>

        {/* Footer */}
        {mode === 'login' && (
          <div className="space-y-2 text-center text-xs">
            <button
              onClick={() => switchMode('forgot')}
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Забыли пароль?
            </button>
            <p className="text-muted-foreground">
              Нет аккаунта?{' '}
              <button
                onClick={() => switchMode('register')}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Зарегистрируйтесь
              </button>
            </p>
          </div>
        )}

        {mode === 'register' && (
          <p className="text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{' '}
            <button
              onClick={() => switchMode('login')}
              className="text-foreground underline-offset-4 hover:underline"
            >
              Войдите
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
