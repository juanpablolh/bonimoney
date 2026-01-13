-- DEFINITIVE FIX FOR USER DELETION
-- This script fixes both direct links from auth.users AND secondary links from 
-- project_members to splits/expenses that block the deletion chain.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. FIX splits (member_id) -> CASCADE
    -- If a member is deleted (via user deletion), their splits should also be deleted.
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'splits' AND column_name = 'member_id' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.splits DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.splits ADD CONSTRAINT splits_member_id_fkey FOREIGN KEY (member_id) REFERENCES project_members(id) ON DELETE CASCADE;

    -- 2. FIX expenses (paid_by & settled_to) -> SET NULL
    -- If a member is deleted, we keep the expense but clear who paid/settled it.
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'expenses' AND column_name = 'paid_by' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES project_members(id) ON DELETE SET NULL;

    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'expenses' AND column_name = 'settled_to' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_settled_to_fkey FOREIGN KEY (settled_to) REFERENCES project_members(id) ON DELETE SET NULL;

    -- 3. FIX project_members (user_id) -> CASCADE
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'project_members' AND column_name = 'user_id' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.project_members DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.project_members ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    -- 4. FIX projects (owner_id) -> SET NULL
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'projects' AND column_name = 'owner_id' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.projects ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

    -- 5. FIX metadata fields (created_by, invited_by, etc) -> SET NULL
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'expenses' AND (column_name = 'created_by' OR column_name = 'deleted_by') AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON DELETE SET NULL;

    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'project_members' AND column_name = 'invited_by' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.project_members DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.project_members ADD CONSTRAINT project_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

    RAISE NOTICE 'Nuclear fix applied successfully: User deletion chain is now unblocked.';
END $$;
