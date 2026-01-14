-- =====================================================
-- Optimize RLS Performance & Consolidate Policies
-- 1. Remove ALL duplicate policies
-- 2. Wrap auth.uid() calls in (select ...) to prevent
--    re-evaluation for each row
-- 3. Combine multiple SELECT policies into single policies
-- 4. Fix security warnings for member_balances
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- =====================================================

-- =====================================================
-- DROP ALL EXISTING POLICIES FIRST
-- =====================================================

-- Projects
DROP POLICY IF EXISTS "Users can view owned projects" ON projects;
DROP POLICY IF EXISTS "Users can view member projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Owners can update projects" ON projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON projects;

-- Project Members
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Owners can view all members" ON project_members;
DROP POLICY IF EXISTS "Users can view own membership" ON project_members;
DROP POLICY IF EXISTS "Owners can add members" ON project_members;
DROP POLICY IF EXISTS "Owners can update members" ON project_members;
DROP POLICY IF EXISTS "Owners can remove members" ON project_members;
DROP POLICY IF EXISTS "Users can view pending invitations" ON project_members;

-- User Projects
DROP POLICY IF EXISTS "Users can view their associations" ON user_projects;
DROP POLICY IF EXISTS "Users can view their own associations" ON user_projects;
DROP POLICY IF EXISTS "Users can create associations" ON user_projects;
DROP POLICY IF EXISTS "Users can insert their own associations" ON user_projects;
DROP POLICY IF EXISTS "System can insert user_projects" ON user_projects;
DROP POLICY IF EXISTS "Users can update associations" ON user_projects;
DROP POLICY IF EXISTS "Users can update their own associations" ON user_projects;
DROP POLICY IF EXISTS "Users can delete associations" ON user_projects;
DROP POLICY IF EXISTS "Users can delete their own associations" ON user_projects;
DROP POLICY IF EXISTS "Users and system can create associations" ON user_projects;

-- Expenses
DROP POLICY IF EXISTS "Users can view project expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view expenses" ON expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their expenses" ON expenses;

-- Splits
DROP POLICY IF EXISTS "Users can view expense splits" ON splits;
DROP POLICY IF EXISTS "Users can view splits" ON splits;
DROP POLICY IF EXISTS "Users can create splits" ON splits;
DROP POLICY IF EXISTS "Users can update splits" ON splits;
DROP POLICY IF EXISTS "Users can delete splits" ON splits;

-- Member Balances
DROP POLICY IF EXISTS "Users can view project balances" ON member_balances;
DROP POLICY IF EXISTS "Users can view balances" ON member_balances;
DROP POLICY IF EXISTS "System can create balances" ON member_balances;
DROP POLICY IF EXISTS "Authenticated can create balances" ON member_balances;
DROP POLICY IF EXISTS "System can update balances" ON member_balances;
DROP POLICY IF EXISTS "Authenticated can update balances" ON member_balances;
DROP POLICY IF EXISTS "Owners can delete balances" ON member_balances;
DROP POLICY IF EXISTS "Project members can manage balances" ON member_balances;
DROP POLICY IF EXISTS "Project members can update balances" ON member_balances;

-- =====================================================
-- PROJECTS TABLE POLICIES
-- Single combined SELECT policy using OR
-- =====================================================

CREATE POLICY "Users can view projects"
ON projects FOR SELECT
USING (
  -- Owner can view
  (select auth.uid()) = owner_id
  OR
  -- Member can view (via user_projects)
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = projects.id
    AND user_projects.user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Owners can update projects"
ON projects FOR UPDATE
USING ((select auth.uid()) = owner_id);

CREATE POLICY "Owners can delete projects"
ON projects FOR DELETE
USING ((select auth.uid()) = owner_id);

-- =====================================================
-- PROJECT_MEMBERS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  (select auth.uid()) IN (
    -- User is owner of the project
    SELECT p.owner_id FROM projects p WHERE p.id = project_id
    UNION ALL
    -- User has access via user_projects
    SELECT up.user_id FROM user_projects up WHERE up.project_id = project_members.project_id
  )
  OR
  -- User's email matches pending invitation
  LOWER(email) = LOWER((select auth.email()))
);

CREATE POLICY "Owners can add members"
ON project_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

CREATE POLICY "Owners can update members"
ON project_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

CREATE POLICY "Owners can remove members"
ON project_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

-- =====================================================
-- USER_PROJECTS TABLE POLICIES
-- Single INSERT policy that allows both user and system inserts
-- =====================================================

CREATE POLICY "Users can view their associations"
ON user_projects FOR SELECT
USING ((select auth.uid()) = user_id);

-- Users can only insert their own associations
-- System inserts (invitation acceptance) use SECURITY DEFINER functions
-- which bypass RLS automatically
CREATE POLICY "Users can create associations"
ON user_projects FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update associations"
ON user_projects FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete associations"
ON user_projects FOR DELETE
USING ((select auth.uid()) = user_id);

-- =====================================================
-- EXPENSES TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view expenses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = expenses.project_id
    AND user_projects.user_id = (select auth.uid())
  )
  AND expenses.deleted_at IS NULL
);

CREATE POLICY "Members can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = expenses.project_id
    AND user_projects.user_id = (select auth.uid())
  )
);

-- Users can update their own expenses OR owner can update any expense in their project
CREATE POLICY "Users can update their expenses"
ON expenses FOR UPDATE
USING (
  (select auth.uid()) = created_by
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = expenses.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

-- Users can delete their own expenses OR owner can delete any expense in their project
CREATE POLICY "Users can delete their expenses"
ON expenses FOR DELETE
USING (
  (select auth.uid()) = created_by
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = expenses.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

-- =====================================================
-- SPLITS TABLE POLICIES
-- =====================================================

CREATE POLICY "Users can view splits"
ON splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN user_projects up ON up.project_id = e.project_id
    WHERE e.id = splits.expense_id
    AND up.user_id = (select auth.uid())
    AND e.deleted_at IS NULL
  )
);

-- Users can create splits for their expenses OR owner can create for any expense
CREATE POLICY "Users can create splits"
ON splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND (
      e.created_by = (select auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = e.project_id
        AND p.owner_id = (select auth.uid())
      )
    )
  )
);

-- Users can update splits for their expenses OR owner can update any
CREATE POLICY "Users can update splits"
ON splits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND (
      e.created_by = (select auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = e.project_id
        AND p.owner_id = (select auth.uid())
      )
    )
  )
);

-- Users can delete splits for their expenses OR owner can delete any
CREATE POLICY "Users can delete splits"
ON splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND (
      e.created_by = (select auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = e.project_id
        AND p.owner_id = (select auth.uid())
      )
    )
  )
);

-- =====================================================
-- MEMBER_BALANCES TABLE POLICIES
-- Using SECURITY DEFINER functions for system operations
-- to avoid the "always true" security warning
-- =====================================================

CREATE POLICY "Users can view balances"
ON member_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = member_balances.project_id
    AND user_projects.user_id = (select auth.uid())
  )
);

-- For INSERT/UPDATE: Only allow if user has access to the project
-- Triggers run with elevated permissions anyway
CREATE POLICY "Project members can manage balances"
ON member_balances FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = member_balances.project_id
    AND user_projects.user_id = (select auth.uid())
  )
);

CREATE POLICY "Project members can update balances"
ON member_balances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = member_balances.project_id
    AND user_projects.user_id = (select auth.uid())
  )
);

CREATE POLICY "Owners can delete balances"
ON member_balances FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = member_balances.project_id
    AND projects.owner_id = (select auth.uid())
  )
);

-- =====================================================
-- RLS OPTIMIZATION COMPLETE
-- - All auth.uid() wrapped in (select ...)
-- - Single policy per action per table
-- - No "always true" policies
-- =====================================================
