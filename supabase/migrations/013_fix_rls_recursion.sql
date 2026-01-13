-- =====================================================
-- Fix: Infinite Recursion in RLS Policies
-- 
-- The issue is circular dependency:
-- - project_members policy references projects
-- - projects policy references project_members
-- 
-- Solution: Use a simpler policy for project_members that 
-- doesn't need to query projects table
-- =====================================================

-- Drop the current project_members SELECT policy
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

-- Create a simpler policy that doesn't cause recursion
-- We'll allow users to see:
-- 1. Their own membership records
-- 2. Records for projects they own (using a subquery that doesn't trigger projects RLS)
-- 3. Invitations sent to their email
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  -- User is this member
  user_id = (select auth.uid())
  OR
  -- User is the owner of the project (direct lookup without RLS)
  project_id IN (
    SELECT id FROM projects WHERE owner_id = (select auth.uid())
  )
  OR
  -- User's email matches this invitation
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = (select auth.uid())))
);

-- Also fix the projects policy to avoid the recursion
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;

-- Simpler projects policy - use user_projects instead of project_members
CREATE POLICY "Users can view projects"
ON projects FOR SELECT
USING (
  -- User owns the project
  owner_id = (select auth.uid())
  OR
  -- User has a user_projects entry (maintained separately, no recursion)
  id IN (
    SELECT project_id FROM user_projects WHERE user_id = (select auth.uid())
  )
);

-- Refresh statistics
ANALYZE project_members;
ANALYZE projects;
