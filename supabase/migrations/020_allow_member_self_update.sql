-- =====================================================
-- Allow members to update their own membership details
-- (specifically for updating their display name)
-- =====================================================

DROP POLICY IF EXISTS "Users can update own membership" ON project_members;

CREATE POLICY "Users can update own membership"
ON project_members FOR UPDATE
USING (
  (select auth.uid()) = user_id
);
