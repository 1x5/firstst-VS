import { describe, it, expect } from 'vitest';
import { translateError } from './translate-error';

describe('translateError', () => {
  it('should translate invalid credentials', () => {
    expect(translateError('Invalid login credentials')).toBe(
      'Неверный email или пароль'
    );
  });

  it('should translate rate limiting errors', () => {
    const result = translateError(
      'For security purposes, you can only request this after 60 seconds'
    );
    expect(result).toContain('60');
    expect(result).toContain('секунд');
  });

  it('should translate expired token', () => {
    expect(translateError('Token has expired')).toBe(
      'Ссылка истекла. Запросите новую'
    );
  });

  it('should translate network errors', () => {
    expect(translateError('Network error')).toBe(
      'Ошибка сети. Проверьте подключение к интернету'
    );
  });

  it('should translate password too short', () => {
    expect(translateError('Password should be at least 6 characters')).toBe(
      'Пароль слишком короткий'
    );
  });

  it('should translate same password error', () => {
    expect(
      translateError('New password should be different from the old password')
    ).toBe('Новый пароль должен отличаться от старого');
  });

  it('should return original message if no translation', () => {
    expect(translateError('Some unknown error')).toBe('Some unknown error');
  });
});
