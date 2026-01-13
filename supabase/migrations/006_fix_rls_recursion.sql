-- =====================================================
-- Fix: RLS Infinite Recursion
-- Removes circular dependency in RLS policies
-- =====================================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON projects;

DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Owners can add members" ON project_members;
DROP POLICY IF EXISTS "Owners can update members" ON project_members;
DROP POLICY IF EXISTS "Owners can remove members" ON project_members;

DROP POLICY IF EXISTS "Users can view their project associations" ON user_projects;
DROP POLICY IF EXISTS "Users can create project associations" ON user_projects;
DROP POLICY IF EXISTS "Users can update their project associations" ON user_projects;
DROP POLICY IF EXISTS "Users can delete their project associations" ON user_projects;

DROP POLICY IF EXISTS "Users can view project expenses" ON expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view expense splits" ON splits;
DROP POLICY IF EXISTS "Users can create splits" ON splits;
DROP POLICY IF EXISTS "Users can update splits" ON splits;
DROP POLICY IF EXISTS "Users can delete splits" ON splits;

DROP POLICY IF EXISTS "Users can view project balances" ON member_balances;
DROP POLICY IF EXISTS "System can create balances" ON member_balances;
DROP POLICY IF EXISTS "System can update balances" ON member_balances;
DROP POLICY IF EXISTS "Owners can delete balances" ON member_balances;

-- =====================================================
-- PROJECTS TABLE POLICIES (No circular dependency)
-- =====================================================

-- Users can view projects they own
CREATE POLICY "Users can view owned projects"
ON projects FOR SELECT
USING (auth.uid() = owner_id);

-- Users can view projects where they are members (via user_projects)
CREATE POLICY "Users can view member projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = projects.id
    AND user_projects.user_id = auth.uid()
  )
);

-- Users can create their own projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only project owners can update their projects
CREATE POLICY "Owners can update projects"
ON projects FOR UPDATE
USING (auth.uid() = owner_id);

-- Only project owners can delete their projects
CREATE POLICY "Owners can delete projects"
ON projects FOR DELETE
USING (auth.uid() = owner_id);

-- =====================================================
-- PROJECT_MEMBERS TABLE POLICIES (No circular dependency)
-- =====================================================

-- Users can view members of projects they own
CREATE POLICY "Owners can view all members"
ON project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Users can view their own membership records
CREATE POLICY "Users can view own membership"
ON project_members FOR SELECT
USING (user_id = auth.uid());

-- Project owners can add members
CREATE POLICY "Owners can add members"
ON project_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Project owners can update member roles/status
CREATE POLICY "Owners can update members"
ON project_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- Project owners can remove members
CREATE POLICY "Owners can remove members"
ON project_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- =====================================================
-- USER_PROJECTS TABLE POLICIES
-- =====================================================

-- Users can view their own project associations
CREATE POLICY "Users can view their associations"
ON user_projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own project associations
CREATE POLICY "Users can create associations"
ON user_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own project associations
CREATE POLICY "Users can update associations"
ON user_projects FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own project associations
CREATE POLICY "Users can delete associations"
ON user_projects FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- EXPENSES TABLE POLICIES
-- =====================================================

-- Users can view expenses from their projects (via user_projects)
CREATE POLICY "Users can view project expenses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = expenses.project_id
    AND user_projects.user_id = auth.uid()
  )
  AND expenses.deleted_at IS NULL
);

-- Project members can create expenses (via user_projects)
CREATE POLICY "Members can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = expenses.project_id
    AND user_projects.user_id = auth.uid()
  )
);

-- Users can update expenses they created
CREATE POLICY "Users can update their expenses"
ON expenses FOR UPDATE
USING (auth.uid() = created_by);

-- Users can soft-delete expenses they created
CREATE POLICY "Users can delete their expenses"
ON expenses FOR DELETE
USING (auth.uid() = created_by);

-- =====================================================
-- SPLITS TABLE POLICIES
-- =====================================================

-- Users can view splits for expenses in their projects
CREATE POLICY "Users can view expense splits"
ON splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN user_projects up ON up.project_id = e.project_id
    WHERE e.id = splits.expense_id
    AND up.user_id = auth.uid()
    AND e.deleted_at IS NULL
  )
);

-- Users can create splits for expenses they created
CREATE POLICY "Users can create splits"
ON splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND e.created_by = auth.uid()
  )
);

-- Users can update splits for expenses they created
CREATE POLICY "Users can update splits"
ON splits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND e.created_by = auth.uid()
  )
);

-- Users can delete splits for expenses they created
CREATE POLICY "Users can delete splits"
ON splits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    WHERE e.id = splits.expense_id
    AND e.created_by = auth.uid()
  )
);

-- =====================================================
-- MEMBER_BALANCES TABLE POLICIES
-- =====================================================

-- Users can view balances for their projects (via user_projects)
CREATE POLICY "Users can view project balances"
ON member_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_projects
    WHERE user_projects.project_id = member_balances.project_id
    AND user_projects.user_id = auth.uid()
  )
);

-- System can create balances (typically via triggers)
CREATE POLICY "System can create balances"
ON member_balances FOR INSERT
WITH CHECK (true);

-- System can update balances (typically via triggers)
CREATE POLICY "System can update balances"
ON member_balances FOR UPDATE
USING (true);

-- Project owners can delete balances
CREATE POLICY "Owners can delete balances"
ON member_balances FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = member_balances.project_id
    AND projects.owner_id = auth.uid()
  )
);

-- =====================================================
-- RLS FIX COMPLETE
-- Circular dependency removed by using user_projects
-- =====================================================
