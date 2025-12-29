import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Moon, Sun, LogOut, Loader2, Settings } from 'lucide-react';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/theme';
import { useAuthStore } from '@/stores/auth';
import { useAppearanceStore } from '@/stores/appearance';
import { useFinanceStore, selectBalance } from '@/stores/finance';

// Pages - обычный импорт для стабильности в приватном режиме
import { IncomePage } from '@/pages/IncomePage';
import { ExpensePage } from '@/pages/ExpensePage';
import { AuthPage } from '@/pages/AuthPage';
import { SettingsPage } from '@/pages/SettingsPage';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const { appName, showLogoIcon } = useAppearanceStore();
  const balance = useFinanceStore(selectBalance);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-11 items-center justify-between px-3 sm:h-12 lg:h-14">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            {showLogoIcon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground lg:h-8 lg:w-8">
                <Wallet className="h-3.5 w-3.5 text-background lg:h-4 lg:w-4" />
              </div>
            )}
            <h1 className="text-sm font-semibold sm:text-base lg:text-lg">{appName}</h1>
          </button>

          {/* Balance in center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className={`text-sm font-bold tabular-nums sm:text-base lg:text-lg ${balance < 0 ? 'text-muted-foreground' : ''}`}>
              {formatBalance(balance)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {user && (
              <span className="hidden text-xs text-muted-foreground sm:block">
                {user.email}
              </span>
            )}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (location.pathname === '/settings') {
                    navigate('/');
                  } else {
                    navigate('/settings');
                  }
                }}
                className="h-7 w-7"
                title="Настройки"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="h-7 w-7"
            >
              {isDark ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await signOut();
                  // После выхода перенаправляем на страницу входа
                  navigate('/');
                }}
                className="h-7 w-7"
                title="Выйти"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto flex min-h-[calc(100vh-3.5rem)] flex-col px-3 py-3 sm:py-4 lg:py-6">
        <div className="flex flex-1 flex-col space-y-3 sm:space-y-4 lg:space-y-6">
          <Routes>
            <Route path="/" element={<ExpensePage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expense" element={<ExpensePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, isLoading, initialize } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Добавляем таймаут для защиты от зависания
    const timeoutId = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn('[App] ⚠️ Initialize timeout, forcing render');
      }
      // Принудительно обновляем состояние, если инициализация зависла
      useAuthStore.setState({ isLoading: false });
    }, 15000); // 15 секунд максимум
    
    initialize().finally(() => {
      clearTimeout(timeoutId);
    });
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialize]);

  // Handle 404 redirect from GitHub Pages
  useEffect(() => {
    const redirectPath = sessionStorage.getItem('_404_redirect');
    if (!redirectPath) return;
    
    sessionStorage.removeItem('_404_redirect');
    
    // Сохраняем hash отдельно, если есть
    const [path, hash] = redirectPath.split('#');
    if (hash && !sessionStorage.getItem('_reset_password_hash')) {
      sessionStorage.setItem('_reset_password_hash', hash);
    }
    
    navigate(path, { replace: true });
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Если на странице reset-password, показываем AuthPage
  // (для обработки recovery сессии из email ссылки)
  if (location.pathname.includes('/auth/reset-password')) {
    return <AuthPage />;
  }

  // Показываем AuthPage для неавторизованных пользователей
  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <AppLayout />
      <OfflineIndicator />
    </>
  );
}

export default function App() {
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <BrowserRouter 
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthenticatedApp />
    </BrowserRouter>
  );
}
