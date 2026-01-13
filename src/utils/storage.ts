import { AppData, Expense, Currency } from '../types';

const STORAGE_KEY = 'split-app-data';
const COOKIE_CONSENT_KEY = 'split-cookie-consent';

const isOnline = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.');
};

const hasCookieConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent === 'accepted';
};

const setCookie = (name: string, value: string, days: number = 365): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const secureFlag = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
  } catch {
    // Silent fail
  }
};

const getCookie = (name: string): string | null => {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch {
    // Silent fail
  }
  return null;
};

const deleteCookie = (name: string): void => {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  } catch {
    // Silent fail
  }
};

const saveToCookies = (data: AppData): void => {
  try {
    const jsonString = JSON.stringify(data);
    const maxCookieSize = 4000;

    if (jsonString.length <= maxCookieSize) {
      setCookie(STORAGE_KEY, jsonString);
    } else {
      const chunks: string[] = [];
      for (let i = 0; i < jsonString.length; i += maxCookieSize) {
        chunks.push(jsonString.slice(i, i + maxCookieSize));
      }
      setCookie(`${STORAGE_KEY}_chunks`, chunks.length.toString());
      chunks.forEach((chunk, index) => {
        setCookie(`${STORAGE_KEY}_${index}`, chunk);
      });
    }
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Silent fail
    }
  }
};

const loadFromCookies = (): AppData | null => {
  try {
    const chunksCount = getCookie(`${STORAGE_KEY}_chunks`);

    if (chunksCount) {
      const numChunks = parseInt(chunksCount, 10);
      const chunks: string[] = [];

      for (let i = 0; i < numChunks; i++) {
        const chunk = getCookie(`${STORAGE_KEY}_${i}`);
        if (chunk) {
          chunks.push(chunk);
        } else {
          return null;
        }
      }

      const jsonString = chunks.join('');
      return JSON.parse(jsonString);
    } else {
      const stored = getCookie(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch {
    // Silent fail
  }
  return null;
};

const clearCookies = (): void => {
  try {
    deleteCookie(STORAGE_KEY);
    const chunksCount = getCookie(`${STORAGE_KEY}_chunks`);
    if (chunksCount) {
      const numChunks = parseInt(chunksCount, 10);
      for (let i = 0; i < numChunks; i++) {
        deleteCookie(`${STORAGE_KEY}_${i}`);
      }
      deleteCookie(`${STORAGE_KEY}_chunks`);
    }
  } catch {
    // Silent fail
  }
};

export const loadData = (): AppData => {
  try {
    let stored: string | null = null;
    let data: AppData | null = null;

    if (isOnline()) {
      data = loadFromCookies();

      if (!data) {
        stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            data = JSON.parse(stored);
            if (data) {
              saveToCookies(data);
            }
          } catch {
            // Migration failed
          }
        }
      }
    } else {
      stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
      }
    }

    if (data) {
      data.expenses = data.expenses.map((expense: Expense) => ({
        ...expense,
        date: new Date(expense.date),
        currency: expense.currency || ('CLP' as Currency),
      }));
      return data;
    }
  } catch {
    // Silent fail
  }
  return { members: [], expenses: [] };
};

export const saveData = (data: AppData): void => {
  try {
    if (isOnline() && hasCookieConsent()) {
      saveToCookies(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Silent fail
  }
};

export const clearData = (): void => {
  try {
    if (isOnline()) {
      clearCookies();
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silent fail
  }
};
