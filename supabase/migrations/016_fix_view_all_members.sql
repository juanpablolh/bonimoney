-- =====================================================
-- Fix: Allow users to view ALL members of projects they belong to
-- Uses user_projects to avoid recursion with project_members
-- =====================================================

-- Drop the current policy
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

-- Create updated policy using user_projects (no recursion)
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  -- User is the owner of the project
  project_id IN (
    SELECT id FROM projects WHERE owner_id = (select auth.uid())
  )
  OR
  -- User has access to this project via user_projects table (no recursion)
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = (select auth.uid())
  )
  OR
  -- User's email matches this invitation (for pending invitations)
  LOWER(email) = LOWER((select auth.jwt()->>'email'))
);

-- Refresh statistics
ANALYZE project_members;
