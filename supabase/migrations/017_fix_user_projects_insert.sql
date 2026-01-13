-- =====================================================
-- Fix: Add INSERT policy for user_projects
-- Users need to be able to insert their own records when creating projects
-- =====================================================

-- Drop existing INSERT policy if any
DROP POLICY IF EXISTS "Users can insert their own associations" ON user_projects;

-- Allow users to insert their own user_projects record
CREATE POLICY "Users can insert their own associations"
ON user_projects FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- Also ensure there's an UPDATE policy for completeness
DROP POLICY IF EXISTS "Users can update their own associations" ON user_projects;

CREATE POLICY "Users can update their own associations"
ON user_projects FOR UPDATE
USING (user_id = (select auth.uid()));

-- And DELETE policy
DROP POLICY IF EXISTS "Users can delete their own associations" ON user_projects;

CREATE POLICY "Users can delete their own associations"
ON user_projects FOR DELETE
USING (user_id = (select auth.uid()));

-- Refresh statistics
ANALYZE user_projects;
