-- =====================================================
-- Fix Multiple Permissive Policies on project_members
-- Combines separate policies for owners and self-update
-- into a single optimized policy
-- =====================================================

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Owners can update members" ON project_members;
DROP POLICY IF EXISTS "Users can update own membership" ON project_members;

-- Create single combined policy
CREATE POLICY "Project members can update members"
ON project_members FOR UPDATE
USING (
  -- User is updating themselves
  (select auth.uid()) = user_id
  OR
  -- User is owner of the project
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
);
