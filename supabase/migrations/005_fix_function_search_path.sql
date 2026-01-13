-- =====================================================
-- Fix: Function Search Path Security Issue
-- Adds explicit search_path to all database functions
-- =====================================================

-- Recreate generate_slug function with fixed search_path
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[áàäâ]', 'a', 'g'),
        '[éèëê]', 'e', 'g'
      ),
      '[^a-z0-9\s-]', '', 'g'
    )
  ) || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
END;
$$;

-- Recreate set_project_slug function with fixed search_path
CREATE OR REPLACE FUNCTION public.set_project_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug = public.generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate set_expense_currency function with fixed search_path
CREATE OR REPLACE FUNCTION public.set_expense_currency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.currency IS NULL THEN
    SELECT currency INTO NEW.currency
    FROM public.projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate update_updated_at function with fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate validate_splits_sum function with fixed search_path
CREATE OR REPLACE FUNCTION public.validate_splits_sum()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  expense_amount DECIMAL(12,2);
  splits_sum DECIMAL(12,2);
  split_method_val TEXT;
BEGIN
  -- Get expense amount and split method
  SELECT amount, split_method INTO expense_amount, split_method_val
  FROM public.expenses 
  WHERE id = NEW.expense_id;
  
  -- Only validate for 'exact' and 'manual' split methods
  IF split_method_val IN ('exact', 'manual') THEN
    -- Calculate sum of all splits for this expense
    SELECT COALESCE(SUM(amount_owed), 0) INTO splits_sum
    FROM public.splits
    WHERE expense_id = NEW.expense_id;
    
    -- Check if sum matches expense amount (with small tolerance for rounding)
    IF ABS(splits_sum - expense_amount) > 0.01 THEN
      RAISE WARNING 'Splits sum (%) does not match expense amount (%). This may cause balance discrepancies.', 
        splits_sum, expense_amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- Security Fix Complete
-- All functions now have explicit search_path set
-- =====================================================
