-- =====================================================
-- Fix: get_my_projects to include shared projects
-- This function now returns both owned AND shared projects
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_my_projects();

-- Create updated function that includes shared projects
-- Using SELECT * to match whatever columns exist in projects table
CREATE OR REPLACE FUNCTION get_my_projects()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  icon TEXT,
  owner_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  member_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.icon,
    p.owner_id,
    p.created_at,
    p.updated_at,
    COALESCE((
      SELECT COUNT(*) FROM project_members pm 
      WHERE pm.project_id = p.id AND pm.status = 'accepted'
    ), 1) as member_count
  FROM projects p
  WHERE (
    -- User owns the project
    p.owner_id = auth.uid()
    OR
    -- User is an accepted member (shared project)
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id
      AND pm.user_id = auth.uid()
      AND pm.status = 'accepted'
    )
  )
  AND COALESCE(p.archived, false) = false
  ORDER BY p.updated_at DESC
  LIMIT 50;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_my_projects() TO authenticated;
