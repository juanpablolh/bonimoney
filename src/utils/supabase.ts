import { createClient } from '@supabase/supabase-js';
import { AppData, Expense } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Crear cliente de Supabase con configuración explícita de persistencia
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Usar localStorage para persistir la sesión entre recargas y cierres del navegador
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Refrescar automáticamente el token antes de que expire
    autoRefreshToken: true,
    // Persistir la sesión en el almacenamiento local
    persistSession: true,
    // Detectar sesión en URL (para magic links y confirmaciones de email)
    detectSessionInUrl: true,
  },
});

/**
 * Crear o actualizar un grupo en la base de datos
 */
export const upsertGroup = async (groupId: string, data: AppData): Promise<boolean> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return false;
    }

    const { error } = await supabase
      .from('groups')
      .upsert({
        id: groupId,
        data: data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtener un grupo por ID
 */
export const getGroup = async (groupId: string): Promise<AppData | null> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return null;
    }

    const { data, error } = await supabase
      .from('groups')
      .select('data')
      .eq('id', groupId)
      .single();

    if (error || !data) {
      return null;
    }

    // Los datos pueden estar en data.data o directamente en data
    const groupData = ((data as { data?: AppData }).data) || (data as unknown as AppData);

    if (!groupData) {
      return null;
    }

    // Validar estructura
    if (!groupData.members || !Array.isArray(groupData.members)) {
      return null;
    }

    if (!groupData.expenses || !Array.isArray(groupData.expenses)) {
      return null;
    }

    // Convertir fechas de string a Date objects (JSON serializa Date como string)
    const normalizedData: AppData = {
      members: groupData.members,
      expenses: groupData.expenses.map((expense: Expense) => ({
        ...expense,
        date: expense.date instanceof Date ? expense.date : new Date(expense.date),
      })),
    };

    return normalizedData;
  } catch {
    return null;
  }
};

/**
 * Suscribirse a cambios en tiempo real de un grupo
 */
export const subscribeToGroup = (
  groupId: string,
  callback: (data: AppData | null) => void
) => {
  const channel = supabase
    .channel(`group:${groupId}`, {
      config: {
        broadcast: { self: true },
      },
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'groups',
        filter: `id=eq.${groupId}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          callback(null);
        } else {
          const groupData = await getGroup(groupId);
          if (groupData) {
            callback(groupData);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
