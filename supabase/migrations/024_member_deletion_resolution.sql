-- Migration: Member Deletion Resolution (Reassign or Purge)
-- Description: Updates constraints to prevent data orphaning and adds an RPC to resolve historical data.

-- 1. Update constraints to RESTRICT
-- This prevents accidental deletions via UI or API that would leave inconsistent balances.
DO $$
DECLARE
    r RECORD;
BEGIN
    -- splits(member_id) -> RESTRICT
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'splits' AND column_name = 'member_id' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.splits DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.splits ADD CONSTRAINT splits_member_id_fkey FOREIGN KEY (member_id) REFERENCES project_members(id) ON DELETE RESTRICT;

    -- expenses(paid_by) -> RESTRICT
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'expenses' AND column_name = 'paid_by' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES project_members(id) ON DELETE RESTRICT;

    -- expenses(settled_to) -> RESTRICT
    FOR r IN (SELECT constraint_name FROM information_schema.key_column_usage WHERE table_name = 'expenses' AND column_name = 'settled_to' AND table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_settled_to_fkey FOREIGN KEY (settled_to) REFERENCES project_members(id) ON DELETE RESTRICT;
END $$;

-- 2. RPC to resolve member deletion
CREATE OR REPLACE FUNCTION resolve_member_deletion(
    p_member_to_delete UUID,
    p_resolution_type TEXT, -- 'reassign' or 'purge'
    p_target_member_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project_id TEXT;
    v_owner_id UUID;
    v_record RECORD;
    v_amount_to_distribute NUMERIC;
    v_remaining_count INTEGER;
BEGIN
    -- Get project and owner info
    SELECT project_id INTO v_project_id FROM project_members WHERE id = p_member_to_delete;
    SELECT owner_id INTO v_owner_id FROM projects WHERE id = v_project_id;

    -- Authorization check: Only project owner OR the user themselves (if linked) can resolve this
    -- But usually it's the owner managing the group.
    IF auth.uid() <> v_owner_id THEN
        RAISE EXCEPTION 'Only the project owner can resolve member deletions';
    END IF;

    IF p_resolution_type = 'reassign' THEN
        IF p_target_member_id IS NULL THEN
            RAISE EXCEPTION 'Target member is required for reassignment';
        END IF;

        -- Reassign expenses paid by member
        UPDATE expenses SET paid_by = p_target_member_id WHERE paid_by = p_member_to_delete;
        
        -- Reassign settlements
        UPDATE expenses SET settled_to = p_target_member_id WHERE settled_to = p_member_to_delete;

        -- Reassign splits
        UPDATE splits SET member_id = p_target_member_id WHERE member_id = p_member_to_delete;

    ELSIF p_resolution_type = 'purge' THEN
        -- 1. Delete expenses paid by member (this will cascade to their splits)
        DELETE FROM expenses WHERE paid_by = p_member_to_delete;
        
        -- 2. Delete settlements involving the member
        DELETE FROM expenses WHERE settled_to = p_member_to_delete;

        -- 3. REDISTRIBUTE: For expenses paid by others, redistribute the deleted member's share
        FOR v_record IN SELECT expense_id, amount_owed FROM splits WHERE member_id = p_member_to_delete LOOP
            v_amount_to_distribute := v_record.amount_owed;

            -- Delete the split first
            DELETE FROM splits WHERE member_id = p_member_to_delete AND expense_id = v_record.expense_id;

            -- Count remaining splits for this expense
            SELECT count(*) INTO v_remaining_count FROM splits WHERE expense_id = v_record.expense_id;

            IF v_remaining_count > 0 THEN
                -- Update remaining splits by adding a proportional part of the deleted debt
                UPDATE splits 
                SET amount_owed = amount_owed + (v_amount_to_distribute / v_remaining_count)
                WHERE expense_id = v_record.expense_id;
            ELSE
                -- If no one is left in the splits, but someone paid for it, 
                -- this expense is now "orphaned" or paid for nothing. 
                -- We delete it to keep balances zero.
                DELETE FROM expenses WHERE id = v_record.expense_id;
            END IF;
        END LOOP;

    ELSE
        RAISE EXCEPTION 'Invalid resolution type. Use "reassign" or "purge".';
    END IF;

    -- Finally delete the member
    DELETE FROM project_members WHERE id = p_member_to_delete;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION resolve_member_deletion(UUID, TEXT, UUID) TO authenticated;
