-- =====================================================
-- BoniMoney: Fresh Multi-Project Database Schema
-- Creates new relational tables for multi-project support
-- Preserves existing groups table with JSON data
-- =====================================================

-- Step 1: Create projects table (new relational structure)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'CLP',
  icon TEXT DEFAULT '📊',
  slug TEXT UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  view_mode TEXT DEFAULT 'public',
  edit_mode TEXT DEFAULT 'members',
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'accepted',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT project_members_project_user_unique UNIQUE(project_id, user_id),
  CONSTRAINT project_members_project_email_unique UNIQUE(project_id, email)
);

-- Step 3: Create user_projects table (for quick access)
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_projects_user_project_unique UNIQUE(user_id, project_id)
);

-- Step 4: Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT,
  paid_by UUID REFERENCES project_members(id),
  expense_type TEXT DEFAULT 'expense',
  settled_to UUID REFERENCES project_members(id),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create splits table
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES project_members(id),
  amount_owed DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create member_balances table (denormalized for performance)
CREATE TABLE IF NOT EXISTS member_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT member_balances_project_member_unique UNIQUE(project_id, member_id)
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_status ON project_members(status);
CREATE INDEX IF NOT EXISTS idx_project_members_email ON project_members(email);

CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_last_accessed ON user_projects(user_id, last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted ON expenses(deleted_at);

CREATE INDEX IF NOT EXISTS idx_splits_expense ON splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_member ON splits(member_id);

CREATE INDEX IF NOT EXISTS idx_member_balances_member ON member_balances(member_id);
CREATE INDEX IF NOT EXISTS idx_member_balances_project ON member_balances(project_id);

-- Step 8: Create function to generate human-readable slugs
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_project_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug = generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_slug_trigger ON projects;
CREATE TRIGGER project_slug_trigger
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_project_slug();

-- Step 10: Create trigger to auto-set expense currency from project
CREATE OR REPLACE FUNCTION set_expense_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.currency IS NULL THEN
    SELECT currency INTO NEW.currency
    FROM projects
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expense_currency_trigger ON expenses;
CREATE TRIGGER expense_currency_trigger
BEFORE INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION set_expense_currency();

-- Step 11: Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS project_members_updated_at ON project_members;
CREATE TRIGGER project_members_updated_at
BEFORE UPDATE ON project_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Next steps:
-- 1. Keep existing 'groups' table for backward compatibility
-- 2. New data will use the relational tables
-- 3. Optionally migrate JSON data from 'groups' to new tables
-- 4. Update RLS policies for new tables
-- =====================================================

-- Note: The old 'groups' table is preserved and can be used
-- for gradual migration or as a backup
