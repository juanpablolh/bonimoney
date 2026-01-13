-- =====================================================
-- Fix: Create RPC function to get user projects
-- This bypasses RLS issues by using SECURITY DEFINER
-- =====================================================

-- Create a function that gets all projects for a user
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION get_user_projects(p_user_id UUID)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  description TEXT,
  currency TEXT,
  icon TEXT,
  color TEXT,
  slug TEXT,
  owner_id UUID,
  view_mode TEXT,
  share_token TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  archived BOOLEAN,
  member_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.currency,
    p.icon,
    p.color,
    p.slug,
    p.owner_id,
    p.view_mode,
    p.share_token,
    p.created_at,
    p.updated_at,
    COALESCE(p.archived, false) as archived,
    COALESCE((
      SELECT COUNT(*) FROM project_members pm 
      WHERE pm.project_id = p.id AND pm.status = 'accepted'
    ), 0) as member_count
  FROM projects p
  WHERE p.id IN (
    -- Projects where user is owner
    SELECT pr.id FROM projects pr WHERE pr.owner_id = p_user_id
    UNION
    -- Projects where user is accepted member
    SELECT pm.project_id FROM project_members pm 
    WHERE pm.user_id = p_user_id AND pm.status = 'accepted'
  )
  AND COALESCE(p.archived, false) = false
  ORDER BY p.updated_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_projects(UUID) TO authenticated;
