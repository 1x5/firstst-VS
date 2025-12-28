// Безопасный wrapper для localStorage, который работает в приватном режиме
import { StateStorage } from 'zustand/middleware';

// In-memory storage для приватного режима
const memoryStorage: Record<string, string> = {};

// Проверяем доступность localStorage
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Проверяем доступность sessionStorage
const isSessionStorageAvailable = (): boolean => {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return false;
    }
    const test = '__sessionStorage_test__';
    window.sessionStorage.setItem(test, test);
    window.sessionStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    // Пытаемся использовать localStorage
    if (isLocalStorageAvailable()) {
      try {
        return window.localStorage.getItem(name);
      } catch (error) {
        // Если ошибка, пробуем sessionStorage
      }
    }
    
    // Fallback на sessionStorage (работает в приватном режиме)
    if (isSessionStorageAvailable()) {
      try {
        return window.sessionStorage.getItem(name);
      } catch (error) {
        // Если и sessionStorage недоступен, используем memory storage
      }
    }
    
    // Последний fallback - memory storage (только для текущей сессии)
    return memoryStorage[name] || null;
  },
  
  setItem: (name: string, value: string): void => {
    // Пытаемся использовать localStorage
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch (error) {
        // Если ошибка, пробуем sessionStorage
      }
    }
    
    // Fallback на sessionStorage (работает в приватном режиме)
    if (isSessionStorageAvailable()) {
      try {
        window.sessionStorage.setItem(name, value);
        return;
      } catch (error) {
        // Если и sessionStorage недоступен, используем memory storage
      }
    }
    
    // Последний fallback - memory storage (только для текущей сессии)
    memoryStorage[name] = value;
  },
  
  removeItem: (name: string): void => {
    // Пытаемся удалить из localStorage
    if (isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(name);
      } catch (error) {
        // Если ошибка, пробуем sessionStorage
      }
    }
    
    // Удаляем из sessionStorage
    if (isSessionStorageAvailable()) {
      try {
        window.sessionStorage.removeItem(name);
      } catch (error) {
        // Если и sessionStorage недоступен, удаляем из memory storage
      }
    }
    
    // Удаляем из memory storage
    delete memoryStorage[name];
  },
};

