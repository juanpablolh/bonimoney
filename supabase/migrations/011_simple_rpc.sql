-- Simple test RPC function to verify Supabase RPC works
CREATE OR REPLACE FUNCTION get_my_projects()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  icon TEXT,
  owner_id UUID
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, icon, owner_id
  FROM projects
  WHERE owner_id = auth.uid()
  AND COALESCE(archived, false) = false
  ORDER BY updated_at DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION get_my_projects() TO authenticated;
