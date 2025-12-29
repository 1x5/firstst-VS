// Функция для перевода сообщений об ошибках Supabase на русский
export const translateError = (errorMessage: string): string => {
  const lowerMessage = errorMessage.toLowerCase();
  
  // Rate limiting ошибки
  if (lowerMessage.includes('for security purposes') || lowerMessage.includes('can only request this after')) {
    const match = errorMessage.match(/(\d+)\s*seconds?/i);
    const seconds = match ? match[1] : '';
    if (seconds) {
      return `Из соображений безопасности, вы можете повторить запрос только через ${seconds} секунд`;
    }
    return 'Из соображений безопасности, подождите немного перед повторным запросом';
  }
  
  // Ошибки аутентификации
  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
    return 'Неверный email или пароль';
  }
  
  if (lowerMessage.includes('email not confirmed') || lowerMessage.includes('confirm your email')) {
    return 'Подтвердите email';
  }
  
  if (lowerMessage.includes('user already registered') || lowerMessage.includes('already registered')) {
    return 'Пользователь с таким email уже зарегистрирован';
  }
  
  if (lowerMessage.includes('email rate limit') || lowerMessage.includes('too many requests')) {
    return 'Слишком много запросов. Пожалуйста, подождите немного';
  }
  
  if (lowerMessage.includes('signups are disabled')) {
    return 'Регистрация временно отключена';
  }
  
  if (lowerMessage.includes('email address is not authorized')) {
    return 'Этот email не авторизован';
  }
  
  if (lowerMessage.includes('password should be at least')) {
    return 'Пароль слишком короткий';
  }
  
  if (lowerMessage.includes('token has expired') || lowerMessage.includes('expired') || lowerMessage.includes('otp_expired') || lowerMessage.includes('email link is invalid or has expired')) {
    return 'Ссылка истекла. Запросите новую';
  }
  
  if (lowerMessage.includes('invalid token') || lowerMessage.includes('token is invalid') || lowerMessage.includes('access_denied') || lowerMessage.includes('email link is invalid')) {
    return 'Ссылка недействительна или уже использована. Запросите новую';
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'Ошибка сети. Проверьте подключение к интернету';
  }
  
  if (lowerMessage.includes('user not found')) {
    return 'Пользователь не найден';
  }
  
  if (lowerMessage.includes('email already exists') || lowerMessage.includes('email address already registered')) {
    return 'Email уже используется';
  }
  
  if (lowerMessage.includes('weak password')) {
    return 'Пароль слишком простой';
  }
  
  // Ошибки смены пароля
  if (lowerMessage.includes('new password should be different') || lowerMessage.includes('password should be different from the old')) {
    return 'Новый пароль должен отличаться от старого';
  }
  
  if (lowerMessage.includes('same password') || lowerMessage.includes('cannot reuse')) {
    return 'Новый пароль должен отличаться от текущего';
  }
  
  if (lowerMessage.includes('password update') && lowerMessage.includes('failed')) {
    return 'Не удалось обновить пароль';
  }
  
  if (lowerMessage.includes('password reset') && lowerMessage.includes('failed')) {
    return 'Не удалось сбросить пароль';
  }
  
  // Общие ошибки пароля
  if (lowerMessage.includes('password') && lowerMessage.includes('required')) {
    return 'Пароль обязателен';
  }
  
  if (lowerMessage.includes('password') && lowerMessage.includes('invalid')) {
    return 'Неверный формат пароля';
  }
  
  // Ошибки email
  if (lowerMessage.includes('email') && lowerMessage.includes('required')) {
    return 'Email обязателен';
  }
  
  if (lowerMessage.includes('email') && lowerMessage.includes('invalid') || lowerMessage.includes('invalid email')) {
    return 'Неверный формат email';
  }
  
  // Ошибки сессии
  if (lowerMessage.includes('session') && (lowerMessage.includes('expired') || lowerMessage.includes('invalid'))) {
    return 'Сессия истекла. Пожалуйста, войдите заново';
  }
  
  if (lowerMessage.includes('jwt') && (lowerMessage.includes('expired') || lowerMessage.includes('invalid'))) {
    return 'Сессия истекла. Пожалуйста, войдите заново';
  }
  
  // Ошибки обновления пользователя
  if (lowerMessage.includes('user update') && lowerMessage.includes('failed')) {
    return 'Не удалось обновить данные пользователя';
  }
  
  if (lowerMessage.includes('email update') && lowerMessage.includes('failed')) {
    return 'Не удалось обновить email';
  }
  
  // Общие ошибки Supabase
  if (lowerMessage.includes('database') && lowerMessage.includes('error')) {
    return 'Ошибка базы данных. Попробуйте позже';
  }
  
  if (lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
    return 'Ошибка сервера. Попробуйте позже';
  }
  
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('access denied')) {
    return 'Доступ запрещен. Войдите в систему';
  }
  
  if (lowerMessage.includes('forbidden')) {
    return 'Доступ запрещен';
  }
  
  if (lowerMessage.includes('not found')) {
    return 'Ресурс не найден';
  }
  
  if (lowerMessage.includes('bad request') || lowerMessage.includes('invalid request')) {
    return 'Неверный запрос. Проверьте введенные данные';
  }
  
  // Возвращаем оригинальное сообщение, если не найдено перевода
  return errorMessage;
};


