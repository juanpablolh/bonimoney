import { AppData, Expense, Currency } from '../types';

const STORAGE_KEY = 'split-app-data';
const COOKIE_CONSENT_KEY = 'split-cookie-consent';

/**
 * Detecta si la aplicación está corriendo online (no en localhost)
 */
const isOnline = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.');
};

/**
 * Verifica si el usuario ha aceptado el uso de cookies
 */
const hasCookieConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent === 'accepted';
};

/**
 * Funciones para manejar cookies
 */
const setCookie = (name: string, value: string, days: number = 365): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    // Add Secure flag for HTTPS-only cookies
    const secureFlag = window.location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
  } catch (error) {
    console.error('Error setting cookie:', error);
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
  } catch (error) {
    console.error('Error getting cookie:', error);
  }
  return null;
};

const deleteCookie = (name: string): void => {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  } catch (error) {
    console.error('Error deleting cookie:', error);
  }
};

/**
 * Guarda datos en múltiples cookies si el tamaño excede el límite
 * Las cookies tienen un límite de ~4KB, así que dividimos los datos si es necesario
 */
const saveToCookies = (data: AppData): void => {
  try {
    const jsonString = JSON.stringify(data);
    const maxCookieSize = 4000; // ~4KB menos margen de seguridad

    if (jsonString.length <= maxCookieSize) {
      // Si cabe en una cookie, guardamos normalmente
      setCookie(STORAGE_KEY, jsonString);
    } else {
      // Si es muy grande, dividimos en chunks
      const chunks: string[] = [];
      for (let i = 0; i < jsonString.length; i += maxCookieSize) {
        chunks.push(jsonString.slice(i, i + maxCookieSize));
      }

      // Guardamos el número de chunks primero
      setCookie(`${STORAGE_KEY}_chunks`, chunks.length.toString());

      // Guardamos cada chunk en una cookie separada
      chunks.forEach((chunk, index) => {
        setCookie(`${STORAGE_KEY}_${index}`, chunk);
      });
    }
  } catch (error) {
    console.error('Error saving data to cookies:', error);
    // Fallback a localStorage si las cookies fallan
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (localError) {
      console.error('Error saving to localStorage fallback:', localError);
    }
  }
};

/**
 * Carga datos desde múltiples cookies si fueron divididos
 */
const loadFromCookies = (): AppData | null => {
  try {
    const chunksCount = getCookie(`${STORAGE_KEY}_chunks`);

    if (chunksCount) {
      // Datos divididos en múltiples cookies
      const numChunks = parseInt(chunksCount, 10);
      const chunks: string[] = [];

      for (let i = 0; i < numChunks; i++) {
        const chunk = getCookie(`${STORAGE_KEY}_${i}`);
        if (chunk) {
          chunks.push(chunk);
        } else {
          // Si falta algún chunk, no podemos reconstruir los datos
          return null;
        }
      }

      const jsonString = chunks.join('');
      return JSON.parse(jsonString);
    } else {
      // Datos en una sola cookie
      const stored = getCookie(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (error) {
    console.error('Error loading data from cookies:', error);
  }
  return null;
};

/**
 * Elimina todas las cookies relacionadas con el almacenamiento
 */
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
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
};

export const loadData = (): AppData => {
  try {
    let stored: string | null = null;
    let data: AppData | null = null;

    if (isOnline()) {
      // Online: usar cookies
      data = loadFromCookies();

      // Migración: si no hay datos en cookies pero sí en localStorage, migrar
      if (!data) {
        stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            data = JSON.parse(stored);
            // Migrar a cookies
            if (data) {
              saveToCookies(data);
              // Opcional: limpiar localStorage después de migrar
              // localStorage.removeItem(STORAGE_KEY);
            }
          } catch (e) {
            console.error('Error migrating from localStorage:', e);
          }
        }
      }
    } else {
      // Local: usar localStorage
      stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
      }
    }

    if (data) {
      // Convert date strings back to Date objects and add currency if missing (migration)
      data.expenses = data.expenses.map((expense: Expense) => ({
        ...expense,
        date: new Date(expense.date),
        currency: expense.currency || ('CLP' as Currency), // Default to CLP for old expenses
      }));
      return data;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return { members: [], expenses: [] };
};

export const saveData = (data: AppData): void => {
  try {
    if (isOnline() && hasCookieConsent()) {
      // Online y con consentimiento: guardar en cookies
      saveToCookies(data);
    } else {
      // Local o sin consentimiento: guardar en localStorage
      // Nota: Si el usuario rechazó cookies, los datos solo se guardarán en localStorage
      // y se perderán al cerrar el navegador (comportamiento esperado)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const clearData = (): void => {
  try {
    if (isOnline()) {
      // Online: eliminar cookies
      clearCookies();
    } else {
      // Local: eliminar de localStorage
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
