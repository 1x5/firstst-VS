import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeCategoryName,
  sanitizeDescription,
  validateAndSanitizeAmount,
} from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeText', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should respect maxLength', () => {
      expect(sanitizeText('hello world', 5)).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeCategoryName', () => {
    it('should limit to 50 characters', () => {
      const longName = 'a'.repeat(100);
      expect(sanitizeCategoryName(longName).length).toBeLessThanOrEqual(50);
    });
  });

  describe('sanitizeDescription', () => {
    it('should limit to 500 characters', () => {
      const longDesc = 'a'.repeat(1000);
      expect(sanitizeDescription(longDesc).length).toBeLessThanOrEqual(500);
    });
  });

  describe('validateAndSanitizeAmount', () => {
    it('should parse valid amounts', () => {
      expect(validateAndSanitizeAmount('100')).toBe(100);
      expect(validateAndSanitizeAmount('100.50')).toBe(100.5);
      expect(validateAndSanitizeAmount('100,50')).toBe(100.5);
    });

    it('should handle spaces in amount', () => {
      expect(validateAndSanitizeAmount('1 000')).toBe(1000);
    });

    it('should return null for invalid amounts', () => {
      expect(validateAndSanitizeAmount('')).toBe(null);
      expect(validateAndSanitizeAmount('abc')).toBe(null);
      expect(validateAndSanitizeAmount('-100')).toBe(null);
      expect(validateAndSanitizeAmount('0')).toBe(null);
    });

    it('should reject amounts exceeding max value', () => {
      expect(validateAndSanitizeAmount('9999999999999')).toBe(null);
    });

    it('should round to 2 decimal places', () => {
      expect(validateAndSanitizeAmount('100.555')).toBe(100.56);
    });
  });
});
