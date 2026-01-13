-- =====================================================
-- BoniMoney: Invitation System Migration
-- Adds support for email-based project invitations
-- =====================================================

-- Step 1: Add invitation_token column to project_members
ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS invitation_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Step 2: Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_project_members_invitation_token
ON project_members(invitation_token);

-- Step 3: Create function to accept pending invitations
-- This function is called after a user signs in/registers
-- It finds all pending invitations for their email and accepts them
CREATE OR REPLACE FUNCTION accept_pending_invitations(p_user_id UUID, p_email TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accepted_count INTEGER := 0;
  invitation RECORD;
BEGIN
  -- Find all pending invitations for this email
  FOR invitation IN
    SELECT id, project_id
    FROM project_members
    WHERE LOWER(email) = LOWER(p_email)
    AND status = 'pending'
    AND user_id IS NULL
  LOOP
    -- Update the invitation: assign user_id and change status
    UPDATE project_members
    SET
      user_id = p_user_id,
      status = 'accepted',
      joined_at = NOW(),
      updated_at = NOW()
    WHERE id = invitation.id;

    -- Create entry in user_projects for RLS access
    INSERT INTO user_projects (user_id, project_id, last_accessed_at)
    VALUES (p_user_id, invitation.project_id, NOW())
    ON CONFLICT (user_id, project_id) DO NOTHING;

    accepted_count := accepted_count + 1;
  END LOOP;

  RETURN accepted_count;
END;
$$;

-- Step 4: Create function to get invitation details by token (public access for preview)
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  project_id TEXT,
  email TEXT,
  name TEXT,
  status TEXT,
  invited_at TIMESTAMPTZ,
  project_name TEXT,
  project_icon TEXT,
  inviter_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.project_id,
    pm.email,
    pm.name,
    pm.status,
    pm.invited_at,
    p.name as project_name,
    p.icon as project_icon,
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = pm.invited_by),
      'Un usuario'
    ) as inviter_name
  FROM project_members pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.invitation_token = p_token;
END;
$$;

-- Step 5: Create function to accept invitation by token
CREATE OR REPLACE FUNCTION accept_invitation_by_token(p_token UUID, p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  project_id TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  -- Get invitation details
  SELECT pm.id, pm.project_id, pm.email, pm.status, pm.user_id
  INTO v_invitation
  FROM project_members pm
  WHERE pm.invitation_token = p_token;

  -- Check if invitation exists
  IF v_invitation IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invitacion no encontrada'::TEXT;
    RETURN;
  END IF;

  -- Check if already accepted
  IF v_invitation.status = 'accepted' THEN
    RETURN QUERY SELECT TRUE, v_invitation.project_id, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if email matches
  IF LOWER(v_invitation.email) != LOWER(v_user_email) THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, ('Esta invitacion es para ' || v_invitation.email)::TEXT;
    RETURN;
  END IF;

  -- Accept the invitation
  UPDATE project_members
  SET
    user_id = p_user_id,
    status = 'accepted',
    joined_at = NOW(),
    updated_at = NOW()
  WHERE id = v_invitation.id;

  -- Create user_projects entry
  INSERT INTO user_projects (user_id, project_id, last_accessed_at)
  VALUES (p_user_id, v_invitation.project_id, NOW())
  ON CONFLICT (user_id, project_id) DO NOTHING;

  RETURN QUERY SELECT TRUE, v_invitation.project_id, NULL::TEXT;
END;
$$;

-- Step 6: RLS Policy - Allow users to view invitations sent to their email
-- (This allows the invite page to show invitation details before accepting)
DROP POLICY IF EXISTS "Users can view invitations for their email" ON project_members;
CREATE POLICY "Users can view invitations for their email"
ON project_members FOR SELECT
USING (
  LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Step 7: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION accept_pending_invitations(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation_by_token(UUID, UUID) TO authenticated;
