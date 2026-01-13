-- =====================================================
-- COMPREHENSIVE RLS CLEANUP
-- Drops ALL existing SELECT policies and recreates clean ones
-- Run this AFTER applying 009_rpc_get_projects.sql
-- =====================================================

-- ============ PROJECTS TABLE ============
-- Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;
DROP POLICY IF EXISTS "Users can view member projects" ON projects;

-- Create single consolidated policy
CREATE POLICY "Users can view projects"
ON projects FOR SELECT
USING (
  owner_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = projects.id
    AND pm.user_id = (select auth.uid())
    AND pm.status = 'accepted'
  )
);

-- ============ USER_PROJECTS TABLE ============
-- Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Users can view their associations" ON user_projects;
DROP POLICY IF EXISTS "Users can manage associations" ON user_projects;
DROP POLICY IF EXISTS "Users can view associations" ON user_projects;

-- Create single consolidated policy
CREATE POLICY "Users can view their associations"
ON user_projects FOR SELECT
USING (user_id = (select auth.uid()));

-- ============ PROJECT_MEMBERS TABLE ============
-- Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can view members" ON project_members;
DROP POLICY IF EXISTS "Users can view invitations for their email" ON project_members;
DROP POLICY IF EXISTS "Owners can view all members" ON project_members;
DROP POLICY IF EXISTS "Users can view own membership" ON project_members;

-- Create single consolidated policy
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
  OR
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = (select auth.uid())))
);

-- Refresh statistics
ANALYZE projects;
ANALYZE user_projects;
ANALYZE project_members;
