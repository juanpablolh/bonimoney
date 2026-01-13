-- =====================================================
-- BoniMoney: Row Level Security (RLS) Policies
-- Secures all public tables with proper access control
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_balances ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECTS TABLE POLICIES
-- =====================================================

-- Users can view projects they own or are members of
CREATE POLICY "Users can view their projects"
ON projects FOR SELECT
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = projects.id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
  )
);

-- Users can create their own projects
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only project owners can update their projects
CREATE POLICY "Owners can update their projects"
ON projects FOR UPDATE
USING (auth.uid() = owner_id);

-- Only project owners can delete their projects
CREATE POLICY "Owners can delete their projects"
ON projects FOR DELETE
USING (auth.uid() = owner_id);

-- =====================================================
-- PROJECT_MEMBERS TABLE POLICIES
-- =====================================================

-- Users can view members of projects they belong to
CREATE POLICY "Users can view project members"
ON project_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND (
      projects.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = projects.id
        AND pm.user_id = auth.uid()
        AND pm.status = 'accepted'
      )
    )
  )
);

-- Project owners and admins can add members
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
CREATE POLICY "Users can view their project associations"
ON user_projects FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own project associations
CREATE POLICY "Users can create project associations"
ON user_projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own project associations
CREATE POLICY "Users can update their project associations"
ON user_projects FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own project associations
CREATE POLICY "Users can delete their project associations"
ON user_projects FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- EXPENSES TABLE POLICIES
-- =====================================================

-- Users can view expenses from projects they're members of
CREATE POLICY "Users can view project expenses"
ON expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
  )
  AND expenses.deleted_at IS NULL
);

-- Project members can create expenses
CREATE POLICY "Members can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
  )
);

-- Users can update expenses they created
CREATE POLICY "Users can update their expenses"
ON expenses FOR UPDATE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
  )
);

-- Users can soft-delete expenses they created
CREATE POLICY "Users can delete their expenses"
ON expenses FOR DELETE
USING (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = expenses.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
  )
);

-- =====================================================
-- SPLITS TABLE POLICIES
-- =====================================================

-- Users can view splits for expenses they have access to
CREATE POLICY "Users can view expense splits"
ON splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN project_members pm ON pm.project_id = e.project_id
    WHERE e.id = splits.expense_id
    AND pm.user_id = auth.uid()
    AND pm.status = 'accepted'
    AND e.deleted_at IS NULL
  )
);

-- Users can create splits for expenses they created
CREATE POLICY "Users can create splits"
ON splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expenses e
    JOIN project_members pm ON pm.project_id = e.project_id
    WHERE e.id = splits.expense_id
    AND e.created_by = auth.uid()
    AND pm.user_id = auth.uid()
    AND pm.status = 'accepted'
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

-- Users can view balances for projects they're members of
CREATE POLICY "Users can view project balances"
ON member_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = member_balances.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.status = 'accepted'
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
-- RLS POLICIES COMPLETE
-- =====================================================
