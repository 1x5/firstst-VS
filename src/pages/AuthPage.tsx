import { useState, useEffect, useRef } from 'react';
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
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [localError, setLocalError] = useState('');
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const { updatePassword, sendOTP, verifyOTP, isLoading, error, clearError, user } = useAuthStore();
  
  // Refs для автофокуса
  const otpInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Вспомогательная функция для избежания проблем с сужением типов TypeScript
  const getMode = (): AuthMode => mode;
  
  // Автофокус на поле OTP когда оно появляется
  useEffect(() => {
    if (otpSent && !otpVerified && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 100);
    }
  }, [otpSent, otpVerified]);
  
  // Автофокус на поле пароля после проверки OTP
  useEffect(() => {
    if (otpVerified && passwordInputRef.current) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, [otpVerified]);
  
  // Подписка на обновления сессии для обработки обновления пароля
  useEffect(() => {
    if ((mode !== 'reset' && mode !== 'register') || !user) return;
    
    // Если пользователь авторизован после обновления пароля, перенаправляем в настройки
    const checkPasswordUpdate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && user.id === session.user.id) {
        // Проверяем, что это не recovery сессия
        const isRecoverySession = session.user.app_metadata?.provider === 'email' && 
          window.location.pathname.includes('/auth/reset-password');
        
        if (!isRecoverySession) {
          // Сессия обновлена, перенаправляем в настройки
          navigate('/settings?passwordChanged=true&section=account', { replace: true });
        }
      }
    };
    
    // Проверяем через небольшую задержку
    const timeoutId = setTimeout(checkPasswordUpdate, 500);
    return () => clearTimeout(timeoutId);
  }, [user, mode, navigate]);
  
  // Восстанавливаем состояние passwordUpdated из sessionStorage только если пользователь НЕ авторизован
  // Это нужно, чтобы показывать экран успеха только сразу после обновления пароля, а не после авторизации
  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      const saved = sessionStorage.getItem('passwordUpdated') === 'true';
      if (saved) {
        setPasswordUpdated(true);
        // Очищаем сразу, чтобы не показывать снова после авторизации
        sessionStorage.removeItem('passwordUpdated');
      }
    } else if (user) {
      // Если пользователь уже авторизован, очищаем флаг
      setPasswordUpdated(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('passwordUpdated');
      }
    }
  }, [user]);
  
  // Восстанавливаем режим reset из sessionStorage при монтировании
  useEffect(() => {
    if (location.pathname.includes('/auth/reset-password') && !user) {
      setMode('reset');
    }
  }, [location.pathname, user]);
  

  // Упрощенная обработка callback от Supabase для reset password
  const callbackProcessedRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Обрабатываем только на странице reset-password
    if (!location.pathname.includes('/auth/reset-password')) {
      callbackProcessedRef.current = null;
      return;
    }

    // Получаем hash для проверки
    const hashFromWindow = typeof window !== 'undefined' ? window.location.hash : null;
    const hashFromUrl = location.hash;
    const hashFromStorage = typeof window !== 'undefined' 
      ? sessionStorage.getItem('_reset_password_hash')
      : null;
    const hashToCheck = hashFromWindow || hashFromUrl || (hashFromStorage ? `#${hashFromStorage}` : null);

    // Если hash нет, не обрабатываем
    if (!hashToCheck) {
      return;
    }

    // Если уже обработали этот hash, не обрабатываем снова
    if (callbackProcessedRef.current === hashToCheck) {
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
          const decodedDescription = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : '';
          const errorMessage = translateError(decodedDescription || error);
          console.error('[reset-password] Error in URL:', { error, errorDescription: decodedDescription, errorMessage });
          setLocalError(errorMessage || 'Ошибка обработки ссылки');
          setMode('forgot'); // Переключаемся в режим "забыли пароль" для повторного запроса
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
            // Помечаем hash как обработанный (используем hashToProcess, который уже определен выше)
            if (hashToProcess) {
              callbackProcessedRef.current = hashToProcess;
            }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Забыли пароль - отправка OTP кода
    if (mode === 'forgot') {
      if (!otpSent) {
        // Шаг 1: Отправка OTP кода
        if (!email) {
          setLocalError('Введите email');
          return;
        }
        const success = await sendOTP(email, 'recovery');
        if (success) {
          setOtpSent(true);
        }
        return;
      }
      
      if (!otpVerified) {
        // Шаг 2: Проверка OTP кода
        if (!otpCode) {
          setLocalError('Введите код из письма');
          return;
        }
        const success = await verifyOTP(email, otpCode, 'recovery');
        if (success) {
          setOtpVerified(true);
          // После проверки OTP переключаемся в режим reset для установки нового пароля
          // Сохраняем состояние otpSent и otpVerified, чтобы пользователь мог сразу ввести пароль
          setMode('reset');
        }
        return;
      }
    }

    // Регистрация через OTP
    if (mode === 'register') {
      if (!otpSent) {
        // Шаг 1: Отправка OTP кода
        if (!email) {
          setLocalError('Введите email');
          return;
        }
        const success = await sendOTP(email, 'signup');
        if (success) {
          setOtpSent(true);
        }
        return;
      }
      
      if (!otpVerified) {
        // Шаг 2: Проверка OTP кода
        if (!otpCode) {
          setLocalError('Введите код из письма');
          return;
        }
        const success = await verifyOTP(email, otpCode, 'signup');
        if (success) {
          setOtpVerified(true);
        }
        return;
      }
      
      // Шаг 3: Создание пароля после проверки OTP
      if (!password) {
        setLocalError('Введите пароль');
        return;
      }
      
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают');
        return;
      }

      if (password.length < 8) {
        setLocalError('Пароль должен быть не менее 8 символов');
        return;
      }
      
      if (!/[a-zA-Zа-яА-Я]/.test(password)) {
        setLocalError('Пароль должен содержать буквы');
        return;
      }
      
      if (!/\d/.test(password)) {
        setLocalError('Пароль должен содержать цифры');
        return;
      }
      
      // Устанавливаем пароль после успешной проверки OTP
      const success = await updatePassword(password);
      if (success) {
        // Пароль установлен, пользователь авторизован
        navigate('/');
      }
      return;
    }

    // Смена пароля через OTP
    if (mode === 'reset') {
      if (!otpSent) {
        // Шаг 1: Отправка OTP кода
        if (!email) {
          setLocalError('Введите email');
          return;
        }
        const success = await sendOTP(email, 'recovery');
        if (success) {
          setOtpSent(true);
        }
        return;
      }
      
      if (!otpVerified) {
        // Шаг 2: Проверка OTP кода
        if (!otpCode) {
          setLocalError('Введите код из письма');
          return;
        }
        const success = await verifyOTP(email, otpCode, 'recovery');
        if (success) {
          setOtpVerified(true);
        }
        return;
      }
      
      // Шаг 3: Установка нового пароля после проверки OTP
      if (!password) {
        setLocalError('Введите новый пароль');
        return;
      }
      
      if (password !== confirmPassword) {
        setLocalError('Пароли не совпадают');
        return;
      }

      if (password.length < 8) {
        setLocalError('Пароль должен быть не менее 8 символов');
        return;
      }
      
      if (!/[a-zA-Zа-яА-Я]/.test(password)) {
        setLocalError('Пароль должен содержать буквы');
        return;
      }
      
      if (!/\d/.test(password)) {
        setLocalError('Пароль должен содержать цифры');
        return;
      }
      
      const success = await updatePassword(password);
      if (success) {
        // После успешного обновления пароля ждем обновления сессии
        // updateUser должен обновить сессию автоматически через onAuthStateChange
        // Даем время для обновления (максимум 2 секунды)
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          // Проверяем сессию напрямую из Supabase
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const { user: storeUser } = useAuthStore.getState();
          
          // Если сессия есть и пользователь обновился в store
          if (currentSession?.user && storeUser && currentSession.user.id === storeUser.id) {
            // Проверяем, что это не recovery сессия (после updateUser она должна стать обычной)
            // Recovery сессии обычно имеют type=recovery в токене, но после updateUser это должно измениться
            
            // Обновляем пользователя в store на всякий случай
            useAuthStore.setState({
              session: currentSession,
              user: currentSession.user,
              isLoading: false,
            });
            
            // Загружаем данные пользователя в фоне
            useAuthStore.getState().initialize().catch(() => {
              // Игнорируем ошибки загрузки данных
            });
            
            // Перенаправляем в настройки
            navigate('/settings?passwordChanged=true&section=account', { replace: true });
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // Если не удалось дождаться обновления, проверяем сессию вручную
        const { data: { session: finalSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (import.meta.env.DEV) {
            console.error('[reset] Error getting session:', sessionError);
          }
          setLocalError('Ошибка получения сессии');
          return;
        }
        
        if (finalSession?.user) {
          // Обновляем пользователя в store вручную
          useAuthStore.setState({
            session: finalSession,
            user: finalSession.user,
            isLoading: false,
          });
          
          // Загружаем данные пользователя в фоне
          useAuthStore.getState().initialize().catch(() => {
            // Игнорируем ошибки загрузки данных
          });
          
          // Перенаправляем в настройки
          navigate('/settings?passwordChanged=true&section=account', { replace: true });
        } else {
          // Если сессия не найдена, показываем экран успеха (fallback)
          setPasswordUpdated(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('passwordUpdated', 'true');
          }
        }
      }
      return;
    }

    // Вход через пароль
    if (mode === 'login') {
      if (!email) {
        setLocalError('Введите email');
        return;
      }
      
      if (!password) {
        setLocalError('Введите пароль');
        return;
      }
      
      // Используем signIn из store
      try {
        const { signIn } = useAuthStore.getState();
        const success = await signIn(email, password);
        if (!success) {
          // Если signIn вернул false, ошибка уже установлена в store
          const errorMessage = useAuthStore.getState().error;
          if (errorMessage) {
            setLocalError(translateError(errorMessage));
          } else {
            setLocalError('Неверный email или пароль');
          }
        }
        // Если успешно, пользователь обновится через onAuthStateChange и произойдет редирект
      } catch (err: any) {
        const errorMessage = err?.message || 'Ошибка входа';
        setLocalError(translateError(errorMessage));
      }
      return;
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setLocalError('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = localError || error;

  // Экран успешного обновления пароля
  // Показываем только если passwordUpdated = true И пользователь НЕ авторизован
  // Это гарантирует, что экран показывается только сразу после обновления пароля, а не после авторизации
  if (mode === 'reset' && passwordUpdated && !user) {
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

  // Экран успешной отправки письма больше не нужен - теперь используется OTP flow

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

        {/* Error message - показываем перед полями ввода, чтобы не мешал */}
        {displayError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-2.5 text-sm text-destructive">
            {displayError}
          </div>
        )}

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
          {/* Email поле - показываем для login, forgot (когда OTP не отправлен), и для register/reset когда OTP еще не отправлен */}
          {(() => {
            const currentMode = getMode();
            if (currentMode === 'login') return true;
            if (currentMode === 'forgot' && !otpSent) return true;
            if (currentMode === 'register' && !otpSent) return true;
            if (currentMode === 'reset' && !otpSent) return true;
            return false;
          })() && (
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
                  disabled={(() => {
                    const currentMode = getMode();
                    return isLoading || (otpSent && (currentMode === 'register' || currentMode === 'reset'));
                  })()}
                />
              </div>
            </div>
          )}

          {/* OTP код - показываем после отправки OTP и до проверки */}
          {(() => {
            const currentMode = getMode();
            if (currentMode === 'register' && otpSent && !otpVerified) return true;
            if (currentMode === 'reset' && otpSent && !otpVerified) return true;
            if (currentMode === 'forgot' && otpSent && !otpVerified) return true;
            return false;
          })() && (
            <div className="space-y-1.5">
              <Label htmlFor="otpCode" className="text-sm">
                Код из письма
              </Label>
              <div className="relative">
                <Input
                  ref={otpInputRef}
                  id="otpCode"
                  type="text"
                  placeholder="Введите 6-значный код"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-11 text-center text-lg tracking-widest"
                  disabled={isLoading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Код отправлен на {email}
              </p>
            </div>
          )}

          {/* Поле пароля для входа - показываем только для login */}
          {mode === 'login' && (
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

          {/* Поля пароля - показываем только после проверки OTP для регистрации и смены пароля */}
          {(() => {
            const currentMode = getMode();
            if (currentMode === 'register' && otpVerified) return true;
            if (currentMode === 'reset' && otpVerified) return true;
            return false;
          })() && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">
                  Пароль
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={passwordInputRef}
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
            </>
          )}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {(() => {
                  const currentMode = getMode();
                  if (currentMode === 'login') return 'Вход...';
                  if (currentMode === 'register') {
                    return otpSent ? (otpVerified ? 'Регистрация...' : 'Проверка...') : 'Отправка...';
                  }
                  if (currentMode === 'reset') {
                    return otpSent ? (otpVerified ? 'Обновление...' : 'Проверка...') : 'Отправка...';
                  }
                  return 'Отправка...';
                })()}
              </>
            ) : (() => {
              const currentMode = getMode();
              if (currentMode === 'login') return 'Войти';
              if (currentMode === 'register') {
                return otpSent ? (otpVerified ? 'Завершить регистрацию' : 'Проверить код') : 'Отправить код';
              }
              if (currentMode === 'reset') {
                return otpSent ? (otpVerified ? 'Установить пароль' : 'Проверить код') : 'Отправить код';
              }
              return 'Отправить код';
            })()}
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

        {getMode() === 'register' && (
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
