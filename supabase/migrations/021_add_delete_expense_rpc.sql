-- =====================================================
-- Fix Expense Deletion via RPC
-- Bypass RLS update policy issues by using a secure function
-- =====================================================

CREATE OR REPLACE FUNCTION delete_expense(expense_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Perform soft delete if user is creator OR project owner
  UPDATE expenses
  SET 
    deleted_at = NOW(),
    deleted_by = auth.uid()
  WHERE id = expense_id
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = expenses.project_id
      AND projects.owner_id = auth.uid()
    )
  );
  
  -- If no row was updated, it means either:
  -- 1. Expense doesn't exist
  -- 2. User is not authorized
  -- 3. Expense already deleted
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found or access denied';
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_expense(UUID) TO authenticated;
