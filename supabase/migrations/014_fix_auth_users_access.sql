-- =====================================================
-- Fix: Permission denied for auth.users table
-- 
-- Use auth.jwt()->>'email' instead of querying auth.users directly
-- =====================================================

-- Drop the current project_members SELECT policy
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

-- Create policy using auth.jwt() for email access
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  -- User is this member
  user_id = (select auth.uid())
  OR
  -- User is the owner of the project
  project_id IN (
    SELECT id FROM projects WHERE owner_id = (select auth.uid())
  )
  OR
  -- User's email matches this invitation (using JWT, not auth.users)
  LOWER(email) = LOWER((select auth.jwt()->>'email'))
);

-- Refresh statistics
ANALYZE project_members;
