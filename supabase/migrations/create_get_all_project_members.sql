-- =====================================================
-- Función RPC: get_all_project_members
-- =====================================================
-- Propósito: Obtener miembros de múltiples proyectos en una sola query
-- en lugar de hacer N queries individuales (optimización de performance)
--
-- Uso: SELECT * FROM get_all_project_members(ARRAY['project_id_1', 'project_id_2']);
--
-- INSTRUCCIONES PARA EJECUTAR:
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Crear nueva query
-- 3. Pegar este contenido completo
-- 4. Ejecutar (Run)
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_project_members(project_ids TEXT[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  project_id TEXT,
  user_id UUID,
  avatar_url TEXT,
  role TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.name,
    pm.project_id,
    pm.user_id,
    pm.avatar_url,
    pm.role,
    pm.status,
    pm.created_at,
    pm.joined_at
  FROM project_members pm
  WHERE pm.project_id = ANY(project_ids)
    AND pm.status = 'accepted'
  ORDER BY pm.project_id, pm.created_at ASC;
END;
$$;

-- Otorgar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_all_project_members(TEXT[]) TO authenticated;

-- Test de la función (comentado - descomentar para probar)
-- SELECT * FROM get_all_project_members(ARRAY['tu_project_id_aqui']);
