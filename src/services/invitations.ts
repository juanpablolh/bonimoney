import { supabase } from '@/utils/supabase';
import { sendInvitationEmail } from '@/utils/email';

export interface InvitationResult {
  success: boolean;
  error?: string;
  memberId?: string;
}

export interface InvitationDetails {
  id: string;
  project_id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted';
  invited_at: string;
  project_name: string;
  project_icon: string;
  inviter_name: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send a project invitation to an email address
 */
export async function sendProjectInvitation(
  projectId: string,
  email: string,
  inviterName: string,
  projectName: string,
  projectIcon: string
): Promise<InvitationResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, error: 'Email invalido' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Debes iniciar sesion' };
    }

    if (normalizedEmail === user.email?.toLowerCase()) {
      return { success: false, error: 'No puedes invitarte a ti mismo' };
    }

    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id, status, user_id, invitation_token')
      .eq('project_id', projectId)
      .eq('email', normalizedEmail)
      .single();

    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return { success: false, error: 'Este usuario ya es miembro del proyecto' };
      }

      const invitationLink = `${window.location.origin}/invite/${existingMember.invitation_token}`;
      const emailResult = await sendInvitationEmail(
        normalizedEmail,
        inviterName,
        projectName,
        projectIcon,
        invitationLink
      );

      if (!emailResult.success) {
        return { success: false, error: 'Error al enviar el email de invitacion' };
      }

      return { success: true, memberId: existingMember.id };
    }

    const { data: newMember, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        role: 'member',
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
      })
      .select('id, invitation_token')
      .single();

    if (insertError || !newMember) {
      return { success: false, error: 'Error al crear la invitacion' };
    }

    const invitationLink = `${window.location.origin}/invite/${newMember.invitation_token}`;

    await sendInvitationEmail(
      normalizedEmail,
      inviterName,
      projectName,
      projectIcon,
      invitationLink
    );

    return { success: true, memberId: newMember.id };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Resend invitation email for a pending member
 */
export async function resendInvitation(
  memberId: string,
  inviterName: string,
  projectName: string,
  projectIcon: string
): Promise<InvitationResult> {
  try {
    const { data: member, error: fetchError } = await supabase
      .from('project_members')
      .select('id, email, status, invitation_token')
      .eq('id', memberId)
      .single();

    if (fetchError || !member) {
      return { success: false, error: 'Miembro no encontrado' };
    }

    if (member.status !== 'pending') {
      return { success: false, error: 'Este miembro ya acepto la invitacion' };
    }

    if (!member.email) {
      return { success: false, error: 'Este miembro no tiene email registrado' };
    }

    const invitationLink = `${window.location.origin}/invite/${member.invitation_token}`;

    const emailResult = await sendInvitationEmail(
      member.email,
      inviterName,
      projectName,
      projectIcon,
      invitationLink
    );

    if (!emailResult.success) {
      return { success: false, error: 'Error al enviar el email' };
    }

    return { success: true, memberId: member.id };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Get invitation details by token
 */
export async function getInvitationByToken(token: string): Promise<{
  success: boolean;
  invitation?: InvitationDetails;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .rpc('get_invitation_by_token', { p_token: token });

    if (error) {
      return { success: false, error: 'Error al obtener la invitacion' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Invitacion no encontrada o expirada' };
    }

    return { success: true, invitation: data[0] as InvitationDetails };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Accept an invitation by token
 */
export async function acceptInvitationByToken(token: string): Promise<{
  success: boolean;
  projectId?: string;
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Debes iniciar sesion primero' };
    }

    const { data, error } = await supabase
      .rpc('accept_invitation_by_token', {
        p_token: token,
        p_user_id: user.id
      });

    if (error) {
      return { success: false, error: 'Error al aceptar la invitacion' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Error procesando la invitacion' };
    }

    const result = data[0];

    if (!result.success) {
      return { success: false, error: result.error_message || 'Error desconocido' };
    }

    return { success: true, projectId: result.project_id };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Process pending invitations for the current user
 */
export async function processPendingInvitations(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return 0;
    }

    const { data, error } = await supabase
      .rpc('accept_pending_invitations', {
        p_user_id: user.id,
        p_email: user.email
      });

    if (error) {
      return 0;
    }

    return data || 0;

  } catch {
    return 0;
  }
}
