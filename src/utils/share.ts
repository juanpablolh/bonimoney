import { AppData, Expense } from '../types';
import { addMetadata } from './merge';
import pako from 'pako';
import { upsertGroup, getGroup } from './supabase';

// Using localStorage for storage (works for same domain)
// For cross-domain sharing, a backend service would be needed

const SHARE_STORAGE_PREFIX = 'split-share-';

/**
 * Retrieve shared data from localStorage (legacy format support)
 * This function is kept for backward compatibility with old share links that used short IDs
 */
const retrieveSharedData = (id: string): AppData | null => {
  try {
    const stored = localStorage.getItem(`${SHARE_STORAGE_PREFIX}${id}`);
    if (!stored) {
      return null;
    }
    
    const storageData = JSON.parse(stored);
    
    // Check if data has expired
    if (storageData.expiry && Date.now() > storageData.expiry) {
      // Clean up expired data
      localStorage.removeItem(`${SHARE_STORAGE_PREFIX}${id}`);
      return null;
    }
    
    const data = storageData.data;
    
    // Validate data structure
    if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
      throw new Error('Formato de datos inválido');
    }
    
    // Convert date strings back to Date objects
    data.expenses = data.expenses.map((expense: Expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));
    
    return data;
  } catch (error) {
    console.error('Error retrieving shared data:', error);
    return null;
  }
};


/**
 * Convert base64url back to base64 (for legacy format support)
 */
const base64UrlToBase64 = (base64url: string): string => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

/**
 * Generate a random 8-character alphanumeric ID
 * Uses crypto.getRandomValues for better security if available
 */
const generateShortId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < 8; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback to Math.random
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
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('Supabase no está configurado. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env');
      return false;
    }
    
    // Add metadata before storing
    const dataWithMetadata = addMetadata(data);
    
    // Convert dates to ISO strings for JSON serialization
    const serializableData: Omit<AppData, 'expenses'> & { expenses: Array<Omit<Expense, 'date'> & { date: string }> } = {
      ...dataWithMetadata,
      expenses: dataWithMetadata.expenses.map(expense => ({
        ...expense,
        date: expense.date.toISOString(),
      })),
    };
    
    // Store in Supabase (dates will be serialized as strings)
    // Type assertion needed because upsertGroup expects AppData but we're passing serialized dates
    const success = await upsertGroup(id, serializableData as unknown as AppData);
    
    if (!success) {
      console.error('No se pudo guardar en Supabase. Verifica que la tabla "groups" existe y que las políticas RLS están configuradas correctamente.');
    }
    
    return success;
  } catch (error: unknown) {
    console.error('Error storing data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Error code:', error.code);
    }
    return false;
  }
};

/**
 * Retrieve data from Supabase using 8-character ID
 */
const retrieveDataFromService = async (id: string): Promise<AppData | null> => {
  try {
    // Try Supabase first
    const data = await getGroup(id);
    if (data) {
      // getGroup already converts dates, but ensure they're Date objects
      data.expenses = data.expenses.map((expense: Expense) => ({
        ...expense,
        date: expense.date instanceof Date ? expense.date : new Date(expense.date),
      }));
      return data;
    }
    
    // Fallback to localStorage if Supabase is not configured
    if (!import.meta.env.VITE_SUPABASE_URL) {
      return retrieveSharedData(id);
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving data:', error);
    // Fallback to localStorage
    return retrieveSharedData(id);
  }
};

/**
 * Generate share URL with 8-character ID
 * Data is stored in Supabase for real-time synchronization
 */
export const generateShareUrl = async (data: AppData): Promise<string> => {
  try {
    // Generate 8-character ID
    const shortId = generateShortId();
    
    // Store data in Supabase (wait for it to complete)
    const success = await storeDataInService(shortId, data);
    
    if (!success) {
      throw new Error('No se pudo guardar los datos en la base de datos');
    }
    
    // Generate URL with short ID
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}#share=${shortId}`;
  } catch (error) {
    console.error('Error generating share URL:', error);
    throw new Error('Error al generar el link de compartir');
  }
};

/**
 * Extract shared data from URL hash
 * Supports 8-character ID format (new) and legacy formats
 */
export const extractSharedDataFromUrl = async (): Promise<AppData | null> => {
  try {
    const hash = window.location.hash;
    
    if (!hash.startsWith('#share=')) {
      return null;
    }
    
    const shareData = hash.substring(7); // Remove '#share='
    
    // New format: 8-character ID (Supabase)
    if (shareData.length === 8 && /^[A-Za-z0-9]{8}$/.test(shareData)) {
      const data = await retrieveDataFromService(shareData);
      if (data) {
        // Validate data structure
        if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
          throw new Error('Formato de datos inválido');
        }
        // Additional validation: ensure arrays are not too large (prevent DoS)
        if (data.members.length > 1000 || data.expenses.length > 10000) {
          console.error('⚠️ Datos demasiado grandes, posible ataque DoS');
          throw new Error('Datos demasiado grandes');
        }
        return data;
      }
    }
    
    // Legacy format: compressed base64url (longer than 8 chars)
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
      } catch (compressedError) {
        console.warn('Failed to decompress:', compressedError);
      }
    }
    
    // Legacy format: uncompressed base64 (longer than 8 chars)
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
      } catch (base64Error) {
        console.warn('Failed to decode base64:', base64Error);
      }
    }
  } catch (error) {
    console.error('Error extracting shared data from URL:', error);
  }
  
  return null;
};

/**
 * Clear share data from URL
 */
export const clearShareDataFromUrl = (): void => {
  if (window.location.hash.startsWith('#share=')) {
    // Remove hash without reloading page
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

// Legacy functions for backward compatibility (if needed)
export const exportDataToBase64 = (data: AppData): string => {
  try {
    const jsonString = JSON.stringify(data);
    const base64 = btoa(unescape(encodeURIComponent(jsonString)));
    return base64;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Error al exportar los datos');
  }
};

export const importDataFromBase64 = (base64: string): AppData | null => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64)));
    const data: AppData = JSON.parse(jsonString);
    
    // Validate data structure
    if (!data || !Array.isArray(data.members) || !Array.isArray(data.expenses)) {
      throw new Error('Formato de datos inválido');
    }
    
    // Convert date strings back to Date objects
    data.expenses = data.expenses.map((expense: Expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));
    
    return data;
  } catch (error) {
    console.error('Error importing data:', error);
    return null;
  }
};

