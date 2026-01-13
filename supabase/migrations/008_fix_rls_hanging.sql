-- =====================================================
-- Fix: RLS Policies Performance Issues
-- 
-- Issues addressed:
-- 1. Multiple permissive policies on project_members causing slow queries
-- 2. auth.uid() being re-evaluated for each row instead of using (select auth.uid())
-- 3. Circular dependency with user_projects causing queries to hang
-- =====================================================

-- First, drop ALL existing SELECT policies on project_members to consolidate them
DROP POLICY IF EXISTS "Users can view invitations for their email" ON project_members;
DROP POLICY IF EXISTS "Users can view members" ON project_members;
DROP POLICY IF EXISTS "Owners can view all members" ON project_members;
DROP POLICY IF EXISTS "Users can view own membership" ON project_members;

-- Create a single consolidated SELECT policy for project_members
-- Uses (select auth.uid()) for optimal performance
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  -- User is a member of the project (via their user_id)
  user_id = (select auth.uid())
  OR
  -- User is the owner of the project
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
  OR
  -- User's email matches an invitation (for pending invitations)
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = (select auth.uid())))
);

-- Fix the projects table policies as well
DROP POLICY IF EXISTS "Users can view member projects" ON projects;
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;

-- Single consolidated policy for viewing projects
CREATE POLICY "Users can view their projects"
ON projects FOR SELECT
USING (
  -- User owns the project
  owner_id = (select auth.uid())
  OR
  -- User is an accepted member
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = projects.id
    AND pm.user_id = (select auth.uid())
    AND pm.status = 'accepted'
  )
);

-- Fix user_projects policies
DROP POLICY IF EXISTS "Users can view their associations" ON user_projects;

CREATE POLICY "Users can view their associations"
ON user_projects FOR SELECT
USING (user_id = (select auth.uid()));

-- Analyze tables to update statistics after policy changes
ANALYZE project_members;
ANALYZE projects;
ANALYZE user_projects;
