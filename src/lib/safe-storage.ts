// Безопасный wrapper для localStorage, который работает в приватном режиме
import { StateStorage } from 'zustand/middleware';

// In-memory storage для приватного режима
const memoryStorage: Record<string, string> = {};

export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      // Пытаемся использовать localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch (error) {
      // Если localStorage недоступен (приватный режим), используем memory storage
      console.warn('localStorage недоступен, используем memory storage:', error);
    }
    
    // Fallback на memory storage
    return memoryStorage[name] || null;
  },
  
  setItem: (name: string, value: string): void => {
    try {
      // Пытаемся использовать localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
        return;
      }
    } catch (error) {
      // Если localStorage недоступен (приватный режим), используем memory storage
      console.warn('localStorage недоступен, используем memory storage:', error);
    }
    
    // Fallback на memory storage
    memoryStorage[name] = value;
  },
  
  removeItem: (name: string): void => {
    try {
      // Пытаемся использовать localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
        return;
      }
    } catch (error) {
      // Если localStorage недоступен, удаляем из memory storage
      console.warn('localStorage недоступен, используем memory storage:', error);
    }
    
    // Fallback на memory storage
    delete memoryStorage[name];
  },
};

