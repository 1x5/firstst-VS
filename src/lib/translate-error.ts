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
  
  if (lowerMessage.includes('token has expired') || lowerMessage.includes('expired') || lowerMessage.includes('otp_expired')) {
    return 'Ссылка истекла. Запросите новую';
  }
  
  if (lowerMessage.includes('invalid token') || lowerMessage.includes('token is invalid') || lowerMessage.includes('access_denied')) {
    return 'Недействительная ссылка';
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
  
  // Возвращаем оригинальное сообщение, если не найдено перевода
  return errorMessage;
};

