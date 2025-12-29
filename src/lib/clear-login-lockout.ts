/**
 * Утилита для сброса блокировки входа (для отладки)
 * Использование: clearLoginLockout('user@example.com')
 */
export const clearLoginLockout = (email: string) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage not available');
    return;
  }

  const attemptKey = `login_attempts_${email}`;
  const lockoutKey = `login_lockout_${email}`;

  window.localStorage.removeItem(attemptKey);
  window.localStorage.removeItem(lockoutKey);

  console.log('Login lockout cleared for:', email);
};

/**
 * Проверка статуса блокировки для email
 */
export const checkLoginLockout = (email: string): { locked: boolean; minutesLeft?: number } => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { locked: false };
  }

  const lockoutKey = `login_lockout_${email}`;
  const lockoutUntil = window.localStorage.getItem(lockoutKey);

  if (!lockoutUntil) {
    return { locked: false };
  }

  const lockoutTime = parseInt(lockoutUntil, 10);
  const now = Date.now();

  if (now < lockoutTime) {
    const minutesLeft = Math.ceil((lockoutTime - now) / 60000);
    return { locked: true, minutesLeft };
  }

  // Блокировка истекла, удаляем
  window.localStorage.removeItem(lockoutKey);
  return { locked: false };
};

