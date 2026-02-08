# 📊 Migraciones de Base de Datos - Supabase

## 🚀 Cómo ejecutar las migraciones

### Opción 1: Vía Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido del archivo `.sql` que quieres ejecutar
5. Click en **Run** (o presiona Ctrl/Cmd + Enter)
6. Verifica que se ejecutó sin errores (debe aparecer "Success" en verde)

### Opción 2: Vía Supabase CLI

```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Iniciar sesión
supabase login

# Ejecutar migración
supabase db push
```

---

## 📝 Migraciones Disponibles

### `create_get_all_project_members.sql` - ⚡ PERFORMANCE

**Propósito:** Optimización de performance para consultas de miembros

**Antes:** N queries individuales (una por proyecto)
**Después:** 1 sola query para todos los proyectos

**Impacto esperado:** Reducción de 40-60% en tiempo de carga del Dashboard Global

**Estado:** ✅ Requerida para FASE 2 del plan de optimización

---

## ✅ Verificación Post-Migración

Después de ejecutar `create_get_all_project_members.sql`, verifica que funciona:

```sql
-- Reemplaza 'tu_project_id' con un ID real de tu base de datos
SELECT * FROM get_all_project_members(ARRAY['tu_project_id']);

-- Debe retornar los miembros de ese proyecto
```

Si ves datos, ¡la migración fue exitosa! ✅

---

## 🔄 Rollback

Si necesitas revertir la migración:

```sql
DROP FUNCTION IF EXISTS get_all_project_members(TEXT[]);
```

---

## 📞 Soporte

Si encuentras algún error, verifica:
1. ✅ Que la tabla `project_members` exista
2. ✅ Que tengas permisos de `SECURITY DEFINER`
3. ✅ Que no haya otra función con el mismo nombre
