import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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

  const { signIn, signUp, resetPassword, updatePassword, isLoading, error, clearError, user } = useAuthStore();
  
  // Восстанавливаем режим reset из sessionStorage при монтировании
  useEffect(() => {
    if (location.pathname.includes('/auth/reset-password')) {
      if (location.hash) {
        // Если есть hash, значит это callback от Supabase
        // Режим будет установлен в handleResetPasswordCallback
        return;
      }
      
      // Если нет hash, но есть сохраненное состояние
      if (passwordUpdated) {
        setMode('reset');
        if (import.meta.env.DEV) {
          console.log('[reset-password] Restored reset mode from sessionStorage');
        }
      }
    }
  }, [location.pathname, location.hash, passwordUpdated]);
  
  // Логируем изменения user и mode для диагностики
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[AuthPage] State changed:', { 
        hasUser: !!user, 
        userId: user?.id, 
        email: user?.email,
        mode,
        pathname: location.pathname,
        hasHash: !!location.hash
      });
    }
  }, [user, mode, location.pathname, location.hash]);

  // Обработка callback от Supabase для reset password
  useEffect(() => {
    const handleResetPasswordCallback = async () => {
      if (import.meta.env.DEV) {
        console.log('[reset-password] ===== CALLBACK HANDLING START =====');
        console.log('[reset-password] Location:', {
          pathname: location.pathname,
          hash: location.hash ? location.hash.substring(0, 50) + '...' : 'empty',
          search: location.search,
          fullUrl: window.location.href
        });
      }
      
      // ВАЖНО: Проверяем sessionStorage ПЕРВЫМ ДЕЛОМ (hash мог быть сохранен через 404.html)
      // Это критично, так как GitHub Pages может очистить hash из URL
      const hashFromStorage = typeof window !== 'undefined' 
        ? sessionStorage.getItem('_reset_password_hash')
        : null;
      
      // Проверяем hash в URL (может быть пустым из-за 404)
      const hashFromUrl = location.hash;
      
      // Также проверяем window.location.hash напрямую (может быть еще не обработан React Router)
      const hashFromWindow = typeof window !== 'undefined' ? window.location.hash : null;
      
      if (import.meta.env.DEV) {
        console.log('[reset-password] Hash sources:', {
          fromUrl: hashFromUrl ? 'yes (' + hashFromUrl.substring(0, 30) + '...)' : 'no',
          fromWindow: hashFromWindow ? 'yes (' + hashFromWindow.substring(0, 30) + '...)' : 'no',
          fromStorage: hashFromStorage ? 'yes (' + hashFromStorage.substring(0, 30) + '...)' : 'no',
        });
      }
      
      // Приоритет: hash из window.location (самый надежный), затем из location.hash, затем из sessionStorage
      const hashToProcess = hashFromWindow || hashFromUrl || (hashFromStorage ? `#${hashFromStorage}` : null);
      
      if (!hashToProcess) {
        if (import.meta.env.DEV) {
          console.warn('[reset-password] ⚠️ No hash found in URL, window.location, or sessionStorage');
          console.warn('[reset-password] This means the recovery link was not processed correctly');
        }
        return;
      }
      
      // Сохраняем hash в sessionStorage на случай перезагрузки (если еще не сохранен)
      if (typeof window !== 'undefined') {
        const hashValue = hashToProcess.startsWith('#') ? hashToProcess.substring(1) : hashToProcess;
        if (!hashFromStorage || hashFromStorage !== hashValue) {
          sessionStorage.setItem('_reset_password_hash', hashValue);
          if (import.meta.env.DEV) {
            console.log('[reset-password] Saved hash to sessionStorage');
          }
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('[reset-password] Processing hash:', hashToProcess.substring(0, 100) + '...');
      }
      
      try {
          // Парсим hash параметры (убираем # в начале)
          const hashString = hashToProcess.startsWith('#') ? hashToProcess.substring(1) : hashToProcess;
          const hashParams = new URLSearchParams(hashString);
          const type = hashParams.get('type');
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const error = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');
          
          if (import.meta.env.DEV) {
            console.log('[reset-password] Parsed params:', { 
              type, 
              hasAccessToken: !!accessToken, 
              hasRefreshToken: !!refreshToken,
              error,
              errorDescription
            });
          }
          
          // Проверяем на ошибки в URL
          if (error) {
            if (import.meta.env.DEV) {
              console.error('[reset-password] Error in URL:', error, errorDescription);
            }
            setLocalError(translateError(errorDescription || error) || 'Ошибка обработки ссылки');
            const newUrl = window.location.pathname + window.location.search;
            window.history.replaceState(null, '', newUrl);
            return;
          }
          
          if (type === 'recovery' && accessToken) {
            if (import.meta.env.DEV) {
              console.log('[reset-password] Setting session from recovery token...');
            }
            
            // Устанавливаем сессию из токена
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (sessionError) {
              if (import.meta.env.DEV) {
                console.error('[reset-password] Session error:', sessionError);
              }
              setLocalError(translateError(sessionError.message) || 'Ссылка недействительна или истекла');
              const newUrl = window.location.pathname + window.location.search;
              window.history.replaceState(null, '', newUrl);
              return;
            }

            if (import.meta.env.DEV) {
              console.log('[reset-password] Session set successfully:', {
                hasSession: !!sessionData?.session,
                userId: sessionData?.session?.user?.id,
                email: sessionData?.session?.user?.email
              });
            }

            // Проверяем, что сессия установлена
            if (sessionData?.session) {
              // Переключаемся в режим сброса пароля ПЕРЕД очисткой hash
              setMode('reset');
              if (import.meta.env.DEV) {
                console.log('[reset-password] Mode set to "reset"');
                console.log('[reset-password] Current user after setSession:', sessionData.session.user.id);
                console.log('[reset-password] Session type:', sessionData.session.user.app_metadata?.provider);
              }
              // Очищаем hash из URL БЕЗ перезагрузки страницы
              // Используем replaceState вместо navigate, чтобы избежать 404
              const newUrl = window.location.pathname + window.location.search;
              window.history.replaceState(null, '', newUrl);
              
              // Очищаем сохраненный hash из sessionStorage
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('_reset_password_hash');
              }
              
              if (import.meta.env.DEV) {
                console.log('[reset-password] ===== CALLBACK HANDLING SUCCESS =====');
                console.log('[reset-password] URL cleaned, ready for password reset form');
              }
            } else {
              if (import.meta.env.DEV) {
                console.error('[reset-password] Session data is missing!');
              }
              setLocalError('Не удалось установить сессию');
              const newUrl = window.location.pathname + window.location.search;
              window.history.replaceState(null, '', newUrl);
            }
          } else {
            if (import.meta.env.DEV) {
              console.warn('[reset-password] Invalid recovery params:', { type, hasAccessToken: !!accessToken });
            }
            // Если нет recovery токена, но есть hash, возможно это ошибка
            if (location.hash && !type) {
              setLocalError('Неверная ссылка для сброса пароля');
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('[reset-password] Exception handling callback:', err);
          }
          setLocalError('Ошибка обработки ссылки');
          const newUrl = window.location.pathname + window.location.search;
          window.history.replaceState(null, '', newUrl);
        }
    };

    // Проверяем, если мы на странице reset-password
    if (location.pathname.includes('/auth/reset-password')) {
      if (import.meta.env.DEV) {
        console.log('[reset-password] On reset-password page, handling callback...');
        console.log('[reset-password] Current mode:', mode);
        console.log('[reset-password] Location hash:', location.hash ? location.hash.substring(0, 50) + '...' : 'empty');
        console.log('[reset-password] SessionStorage hash:', sessionStorage.getItem('_reset_password_hash') ? sessionStorage.getItem('_reset_password_hash')!.substring(0, 50) + '...' : 'empty');
      }
      handleResetPasswordCallback();
    } else {
      if (import.meta.env.DEV) {
        console.log('[reset-password] Not on reset-password page, pathname:', location.pathname);
      }
    }
  }, [location.pathname, location.hash, mode]);

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
      // Обновление пароля
      if (import.meta.env.DEV) {
        console.log('[reset-password] Submitting new password...');
        console.log('[reset-password] Current user:', user?.id);
        console.log('[reset-password] Password length:', password.length);
      }
      
      const success = await updatePassword(password);
      
      if (import.meta.env.DEV) {
        console.log('[reset-password] Update password result:', success);
        if (!success) {
          console.error('[reset-password] Update failed, error:', error);
        }
      }
      
      if (success) {
        if (import.meta.env.DEV) {
          console.log('[reset-password] Password updated successfully, showing success screen');
        }
        setPasswordUpdated(true);
        // Сохраняем состояние в sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('passwordUpdated', 'true');
        }
      } else {
        if (import.meta.env.DEV) {
          console.error('[reset-password] Password update failed');
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
