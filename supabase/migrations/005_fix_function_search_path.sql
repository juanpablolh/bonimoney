-- =====================================================
-- Fix: Function Search Path Security Issue
-- Adds explicit search_path to generate_slug function
-- =====================================================

-- Recreate generate_slug function with fixed search_path
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public, pg_temp
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
SET search_path = public, pg_temp
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
SET search_path = public, pg_temp
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
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- Security Fix Complete
-- All functions now have explicit search_path set
-- =====================================================
