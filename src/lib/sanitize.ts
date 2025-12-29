/**
 * Санитизация текстовых полей для защиты от XSS
 */

/**
 * Санитизирует текст, экранируя HTML-символы
 * @param text - Текст для санитизации
 * @param maxLength - Максимальная длина (по умолчанию 500)
 * @returns Санитизированный текст
 */
export function sanitizeText(text: string, maxLength: number = 500): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, maxLength);
}

/**
 * Санитизирует название категории (максимум 50 символов)
 */
export function sanitizeCategoryName(name: string): string {
  return sanitizeText(name, 50);
}

/**
 * Санитизирует описание транзакции (максимум 500 символов)
 */
export function sanitizeDescription(description: string): string {
  return sanitizeText(description, 500);
}

/**
 * Валидирует и санитизирует сумму
 * @param amount - Сумма в виде строки
 * @returns Валидное число или null
 */
export function validateAndSanitizeAmount(amount: string): number | null {
  if (!amount || typeof amount !== 'string') {
    return null;
  }

  // Заменяем запятую на точку
  const normalized = amount.replace(',', '.').replace(/\s/g, '');
  const num = parseFloat(normalized);

  // Проверяем на NaN и Infinity
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Проверяем диапазон (максимум 12 цифр)
  if (num <= 0 || num > 999999999999) {
    return null;
  }

  // Округляем до 2 знаков после запятой
  return Math.round(num * 100) / 100;
}


