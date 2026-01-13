import { AppData, Expense } from '../types';
import { addMetadata } from './merge';
import pako from 'pako';
import { upsertGroup, getGroup } from './supabase';

const SHARE_STORAGE_PREFIX = 'split-share-';

/**
 * Retrieve shared data from localStorage (legacy format support)
 */
const retrieveSharedData = (id: string): AppData | null => {
  try {
    const stored = localStorage.getItem(`${SHARE_STORAGE_PREFIX}${id}`);
    if (!stored) {
      return null;
    }

    const storageData = JSON.parse(stored);

    if (storageData.expiry && Date.now() > storageData.expiry) {
      localStorage.removeItem(`${SHARE_STORAGE_PREFIX}${id}`);
      return null;
    }

    const data = storageData.data;

    if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
      throw new Error('Formato de datos inválido');
    }

    data.expenses = data.expenses.map((expense: Expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));

    return data;
  } catch {
    return null;
  }
};

/**
 * Convert base64url back to base64 (for legacy format support)
 */
const base64UrlToBase64 = (base64url: string): string => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

/**
 * Generate a random 8-character alphanumeric ID
 */
const generateShortId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 8; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return result;
};

/**
 * Store data in Supabase with 8-character ID
 */
const storeDataInService = async (id: string, data: AppData): Promise<boolean> => {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return false;
    }

    const dataWithMetadata = addMetadata(data);

    const serializableData: Omit<AppData, 'expenses'> & { expenses: Array<Omit<Expense, 'date'> & { date: string }> } = {
      ...dataWithMetadata,
      expenses: dataWithMetadata.expenses.map(expense => ({
        ...expense,
        date: expense.date.toISOString(),
      })),
    };

    const success = await upsertGroup(id, serializableData as unknown as AppData);
    return success;
  } catch {
    return false;
  }
};

/**
 * Retrieve data from Supabase using 8-character ID
 */
const retrieveDataFromService = async (id: string): Promise<AppData | null> => {
  try {
    const data = await getGroup(id);
    if (data) {
      data.expenses = data.expenses.map((expense: Expense) => ({
        ...expense,
        date: expense.date instanceof Date ? expense.date : new Date(expense.date),
      }));
      return data;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      return retrieveSharedData(id);
    }

    return null;
  } catch {
    return retrieveSharedData(id);
  }
};

/**
 * Generate share URL with 8-character ID
 */
export const generateShareUrl = async (data: AppData): Promise<string> => {
  const shortId = generateShortId();

  const success = await storeDataInService(shortId, data);

  if (!success) {
    throw new Error('No se pudo guardar los datos en la base de datos');
  }

  const currentUrl = window.location.origin + window.location.pathname;
  return `${currentUrl}#share=${shortId}`;
};

/**
 * Extract shared data from URL hash
 */
export const extractSharedDataFromUrl = async (): Promise<AppData | null> => {
  try {
    const hash = window.location.hash;

    if (!hash.startsWith('#share=')) {
      return null;
    }

    const shareData = hash.substring(7);

    // New format: 8-character ID (Supabase)
    if (shareData.length === 8 && /^[A-Za-z0-9]{8}$/.test(shareData)) {
      const data = await retrieveDataFromService(shareData);
      if (data) {
        if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
          throw new Error('Formato de datos inválido');
        }
        if (data.members.length > 1000 || data.expenses.length > 10000) {
          throw new Error('Datos demasiado grandes');
        }
        return data;
      }
    }

    // Legacy format: compressed base64url
    if (shareData.length > 8 && (shareData.includes('-') || shareData.includes('_'))) {
      try {
        const base64 = base64UrlToBase64(shareData);
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decompressed = pako.inflate(bytes, { to: 'string' });
        const data: AppData = JSON.parse(decompressed);

        if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
          throw new Error('Formato de datos inválido');
        }

        data.expenses = data.expenses.map((expense: Expense) => ({
          ...expense,
          date: new Date(expense.date),
        }));

        return data;
      } catch {
        // Try next format
      }
    }

    // Legacy format: uncompressed base64
    if (shareData.length > 8) {
      try {
        const jsonString = decodeURIComponent(escape(atob(shareData)));
        const data: AppData = JSON.parse(jsonString);

        if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
          throw new Error('Formato de datos inválido');
        }

        data.expenses = data.expenses.map((expense: Expense) => ({
          ...expense,
          date: new Date(expense.date),
        }));

        return data;
      } catch {
        // Failed to parse
      }
    }
  } catch {
    // Failed to extract
  }

  return null;
};

/**
 * Clear share data from URL
 */
export const clearShareDataFromUrl = (): void => {
  if (window.location.hash.startsWith('#share=')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

// Legacy functions for backward compatibility
export const exportDataToBase64 = (data: AppData): string => {
  const jsonString = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64;
};

export const importDataFromBase64 = (base64: string): AppData | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64)));
    const data: AppData = JSON.parse(jsonString);

    if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
      throw new Error('Formato de datos inválido');
    }

    data.expenses = data.expenses.map((expense: Expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));

    return data;
  } catch {
    return null;
  }
};
