import { createClient } from '@supabase/supabase-js';
import { AppData, Expense } from '../types';

// Estas variables deben configurarse con tus credenciales de Supabase
// Obtén estas credenciales en: https://supabase.com/dashboard
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase no está configurado. Las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar definidas.');
  console.error('En producción, verifica que las variables estén configuradas en Vercel: Settings → Environment Variables');
} else {
  console.log('✅ Supabase configurado correctamente');
  console.log('URL:', SUPABASE_URL.substring(0, 30) + '...');
}

// Crear cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tabla: groups
// Estructura:
// - id: text (primary key, 8 caracteres)
// - data: jsonb (AppData serializado)
// - created_at: timestamp
// - updated_at: timestamp

/**
 * Crear o actualizar un grupo en la base de datos
 */
export const upsertGroup = async (groupId: string, data: AppData): Promise<boolean> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase no está configurado correctamente');
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
      console.error('Error upserting group:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Mostrar mensaje más específico según el error
      if (error.code === '42P01') {
        console.error('❌ La tabla "groups" no existe. Ejecuta el SQL en Supabase para crear la tabla.');
      } else if (error.code === '42501') {
        console.error('❌ Error de permisos. Verifica las políticas RLS en Supabase.');
      }
      return false;
    }
    return true;
  } catch (error: unknown) {
    console.error('Error upserting group:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return false;
  }
};

/**
 * Obtener un grupo por ID
 */
export const getGroup = async (groupId: string): Promise<AppData | null> => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Supabase no está configurado. Verifica las variables de entorno.');
      return null;
    }

    console.log('🔍 Buscando grupo con ID:', groupId);
    
    const { data, error } = await supabase
      .from('groups')
      .select('data')
      .eq('id', groupId)
      .single();

    if (error) {
      console.error('❌ Error getting group:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'PGRST116') {
        console.error('⚠️ No se encontró ningún grupo con ese ID. Verifica que el link compartido sea correcto.');
      } else if (error.code === '42P01') {
        console.error('❌ La tabla "groups" no existe. Ejecuta el SQL en Supabase para crear la tabla.');
      }
      return null;
    }

    if (!data) {
      console.warn('⚠️ Query exitosa pero sin datos');
      return null;
    }

    console.log('✅ Grupo encontrado:', data);
    console.log('📦 Estructura de datos:', JSON.stringify(data, null, 2));
    
    // Los datos pueden estar en data.data o directamente en data
    const groupData = ((data as { data?: AppData }).data) || (data as unknown as AppData);
    
    if (!groupData) {
      console.warn('⚠️ No se encontró el campo "data" en la respuesta');
      return null;
    }
    
    console.log('📋 Datos del grupo:', groupData);
    console.log('👥 Miembros:', groupData.members?.length || 0);
    console.log('💰 Gastos:', groupData.expenses?.length || 0);
    
    // Validar estructura
    if (!groupData.members || !Array.isArray(groupData.members)) {
      console.error('❌ Los datos no tienen la estructura correcta. Falta "members" o no es un array');
      return null;
    }
    
    if (!groupData.expenses || !Array.isArray(groupData.expenses)) {
      console.error('❌ Los datos no tienen la estructura correcta. Falta "expenses" o no es un array');
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
  } catch (error: unknown) {
    console.error('❌ Error getting group:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

/**
 * Suscribirse a cambios en tiempo real de un grupo
 * Detecta automáticamente cuando hay nuevos gastos o integrantes
 */
export const subscribeToGroup = (
  groupId: string,
  callback: (data: AppData | null) => void
) => {
  console.log('🔔 Configurando suscripción en tiempo real para grupo:', groupId);
  
  const channel = supabase
    .channel(`group:${groupId}`, {
      config: {
        broadcast: { self: true }, // Recibir nuestros propios cambios también
      },
    })
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'groups',
        filter: `id=eq.${groupId}`,
      },
      async (payload) => {
        console.log('📡 Cambio detectado en Supabase:', {
          eventType: payload.eventType,
          new: payload.new ? 'sí' : 'no',
          old: payload.old ? 'sí' : 'no',
        });
        
        if (payload.eventType === 'DELETE') {
          console.log('🗑️ Grupo eliminado');
          callback(null);
        } else {
          // Hay un cambio (INSERT o UPDATE), obtener los datos actualizados
          console.log('🔄 Obteniendo datos actualizados del grupo...');
          const groupData = await getGroup(groupId);
          
          if (groupData) {
            console.log('✅ Datos actualizados recibidos:', {
              members: groupData.members?.length || 0,
              expenses: groupData.expenses?.length || 0,
            });
            callback(groupData);
          } else {
            console.warn('⚠️ No se pudieron obtener los datos actualizados');
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Suscripción en tiempo real activa. Los cambios se detectarán automáticamente.');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error en la suscripción en tiempo real. Verifica que Realtime esté habilitado en Supabase.');
      } else {
        console.log('📡 Estado de suscripción:', status);
      }
    });

  return () => {
    console.log('🔕 Desuscribiéndose de actualizaciones en tiempo real');
    supabase.removeChannel(channel);
  };
};
