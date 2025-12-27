import { useState } from 'react';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email) {
      setLocalError('Введите email');
      return;
    }

    if (mode === 'forgot') {
      const success = await resetPassword(email);
      if (success) {
        setResetSent(true);
      }
      return;
    }

    if (!password) {
      setLocalError('Введите пароль');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setLocalError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (mode === 'login') {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearError();
    setLocalError('');
    setResetSent(false);
  };

  const displayError = localError || error;

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
        </div>


        {/* Back button for forgot mode */}
        {mode === 'forgot' && (
          <button
            onClick={() => switchMode('login')}
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

          {mode !== 'forgot' && (
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

          {mode === 'register' && (
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
