-- Migration: Advanced Split Methods and Payment Tracking
-- Created: 2026-01-11
-- Description: Adds support for flexible expense splitting (equal, exact, percentage, shares, manual)
--              and external payment tracking (cash, PayPal, Venmo, etc.)

-- ============================================================================
-- 1. Update expenses table
-- ============================================================================

-- Add split method column
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS split_method TEXT DEFAULT 'equal'
    CHECK (split_method IN ('equal', 'exact', 'percentage', 'shares', 'manual'));

-- Update expense_type to include 'payment'
ALTER TABLE expenses 
  DROP CONSTRAINT IF EXISTS expenses_expense_type_check;

ALTER TABLE expenses 
  ADD CONSTRAINT expenses_expense_type_check 
    CHECK (expense_type IN ('expense', 'settlement', 'payment'));

-- Add payment tracking columns
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IN ('cash', 'paypal', 'venmo', 'transfer', 'zelle', 'other'));

ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add metadata for extensibility
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comments
COMMENT ON COLUMN expenses.split_method IS 'Method used to split the expense: equal, exact, percentage, shares, or manual';
COMMENT ON COLUMN expenses.payment_method IS 'External payment method used (if applicable)';
COMMENT ON COLUMN expenses.payment_reference IS 'Reference ID or note for external payment';
COMMENT ON COLUMN expenses.metadata IS 'Additional flexible data (JSON format)';

-- ============================================================================
-- 2. Update splits table
-- ============================================================================

-- Add percentage column for percentage-based splits
ALTER TABLE splits
  ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2)
    CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100));

-- Add shares column for share-based splits
ALTER TABLE splits
  ADD COLUMN IF NOT EXISTS shares INTEGER
    CHECK (shares IS NULL OR shares > 0);

-- Add notes column for additional context
ALTER TABLE splits
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments
COMMENT ON COLUMN splits.percentage IS 'Percentage of total expense (0-100) for percentage-based splits';
COMMENT ON COLUMN splits.shares IS 'Number of shares for share-based splits';
COMMENT ON COLUMN splits.notes IS 'Optional notes about this split';

-- ============================================================================
-- 3. Create indexes for performance
-- ============================================================================

-- Index on split_method for filtering
CREATE INDEX IF NOT EXISTS idx_expenses_split_method ON expenses(split_method);

-- Index on payment_method for filtering
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);

-- Index on metadata for JSONB queries (GIN index)
CREATE INDEX IF NOT EXISTS idx_expenses_metadata ON expenses USING GIN (metadata);

-- ============================================================================
-- 4. Update existing data (backward compatibility)
-- ============================================================================

-- Set split_method to 'equal' for existing expenses (if NULL)
UPDATE expenses 
SET split_method = 'equal' 
WHERE split_method IS NULL;

-- ============================================================================
-- 5. Create helper function for split validation
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_splits_sum()
RETURNS TRIGGER AS $$
DECLARE
  expense_amount DECIMAL(12,2);
  splits_sum DECIMAL(12,2);
  split_method_val TEXT;
BEGIN
  -- Get expense amount and split method
  SELECT amount, split_method INTO expense_amount, split_method_val
  FROM expenses 
  WHERE id = NEW.expense_id;
  
  -- Only validate for 'exact' and 'manual' split methods
  IF split_method_val IN ('exact', 'manual') THEN
    -- Calculate sum of all splits for this expense
    SELECT COALESCE(SUM(amount_owed), 0) INTO splits_sum
    FROM splits
    WHERE expense_id = NEW.expense_id;
    
    -- Check if sum matches expense amount (with small tolerance for rounding)
    IF ABS(splits_sum - expense_amount) > 0.01 THEN
      RAISE WARNING 'Splits sum (%) does not match expense amount (%). This may cause balance discrepancies.', 
        splits_sum, expense_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate splits
DROP TRIGGER IF EXISTS validate_splits_sum_trigger ON splits;
CREATE TRIGGER validate_splits_sum_trigger
  AFTER INSERT OR UPDATE ON splits
  FOR EACH ROW
  EXECUTE FUNCTION validate_splits_sum();

-- ============================================================================
-- 6. Add RLS policies for new columns (if RLS is enabled)
-- ============================================================================

-- Note: RLS policies will be added in a future migration
-- For now, the existing policies on expenses and splits tables apply

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 003 completed successfully';
  RAISE NOTICE 'Added columns: split_method, payment_method, payment_reference, metadata to expenses';
  RAISE NOTICE 'Added columns: percentage, shares, notes to splits';
  RAISE NOTICE 'Created indexes and validation trigger';
END $$;
