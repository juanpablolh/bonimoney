-- =====================================================
-- Fix Invitation System RPC Functions
-- These functions use SECURITY DEFINER to bypass RLS
-- and ensure reliable execution
-- =====================================================

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS accept_pending_invitations(UUID, TEXT);
DROP FUNCTION IF EXISTS get_invitation_by_token(UUID);
DROP FUNCTION IF EXISTS accept_invitation_by_token(UUID, UUID);

-- Recreate accept_pending_invitations with proper SECURITY DEFINER
CREATE OR REPLACE FUNCTION accept_pending_invitations(p_user_id UUID, p_email TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH updated AS (
    UPDATE project_members
    SET
      user_id = p_user_id,
      status = 'accepted',
      joined_at = NOW(),
      updated_at = NOW()
    WHERE LOWER(email) = LOWER(p_email)
      AND status = 'pending'
      AND user_id IS NULL
    RETURNING id, project_id
  ),
  inserted AS (
    INSERT INTO user_projects (user_id, project_id, last_accessed_at)
    SELECT p_user_id, u.project_id, NOW()
    FROM updated u
    ON CONFLICT (user_id, project_id) DO UPDATE SET last_accessed_at = NOW()
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER FROM updated;
$$;

-- Recreate get_invitation_by_token
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pm.id,
    pm.project_id,
    pm.email,
    pm.name,
    pm.status::TEXT,
    pm.invited_at,
    p.name AS project_name,
    p.icon AS project_icon,
    COALESCE(
      (SELECT u.raw_user_meta_data->>'full_name' FROM auth.users u WHERE u.id = pm.invited_by),
      'Un miembro'
    ) AS inviter_name
  FROM project_members pm
  JOIN projects p ON p.id = pm.project_id
  WHERE pm.invitation_token = p_token
  LIMIT 1;
$$;

-- Recreate accept_invitation_by_token
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
BEGIN
  -- Get invitation
  SELECT pm.id, pm.project_id, pm.status, pm.user_id
  INTO v_invitation
  FROM project_members pm
  WHERE pm.invitation_token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, 'Invitación no encontrada';
    RETURN;
  END IF;

  IF v_invitation.status = 'accepted' THEN
    RETURN QUERY SELECT FALSE, v_invitation.project_id, 'Esta invitación ya fue aceptada';
    RETURN;
  END IF;

  IF v_invitation.user_id IS NOT NULL AND v_invitation.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, v_invitation.project_id, 'Esta invitación pertenece a otro usuario';
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
  ON CONFLICT (user_id, project_id) DO UPDATE SET last_accessed_at = NOW();

  RETURN QUERY SELECT TRUE, v_invitation.project_id, NULL::TEXT;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION accept_pending_invitations(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation_by_token(UUID, UUID) TO authenticated;
