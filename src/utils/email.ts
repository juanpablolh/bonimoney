import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);
const FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send magic link authentication email
 */
export async function sendMagicLinkEmail(
  to: string,
  token: string,
  isNewUser: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const magicLink = `${window.location.origin}/auth/verify?token=${token}`;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: isNewUser ? 'Bienvenido a BoniMoney' : 'Tu link de acceso a BoniMoney',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${isNewUser ? 'Bienvenido' : 'Acceso'} a BoniMoney</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">BoniMoney</h1>
            </div>

            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              ${isNewUser ? `
                <h2 style="color: #667eea; margin-top: 0;">¡Bienvenido a BoniMoney!</h2>
                <p>Estamos emocionados de tenerte con nosotros. BoniMoney hace que dividir gastos sea simple y transparente.</p>
              ` : `
                <h2 style="color: #667eea; margin-top: 0;">Tu link de acceso está listo</h2>
                <p>Haz clic en el botón de abajo para acceder a tu cuenta.</p>
              `}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                  ${isNewUser ? 'Crear mi cuenta' : 'Acceder a BoniMoney'}
                </a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Nota:</strong> Este link expira en 15 minutos por seguridad.
              </p>

              <p style="color: #666; font-size: 14px;">
                Si no solicitaste este email, puedes ignorarlo de forma segura.
              </p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center;">
                BoniMoney - Divide gastos sin complicaciones<br>
                <a href="${window.location.origin}/privacy-policy.html" style="color: #667eea; text-decoration: none;">Política de Privacidad</a> |
                <a href="${window.location.origin}/terms-of-service.html" style="color: #667eea; text-decoration: none;">Términos de Servicio</a>
              </p>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send project invitation email via Supabase Edge Function
 */
export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  projectName: string,
  _projectIcon: string,
  invitationLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const { supabase } = await import('./supabase');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        to,
        inviterName,
        projectName,
        invitationLink,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test Resend configuration
 */
export async function testResendConfig(testEmail: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: testEmail,
      subject: 'Resend configurado correctamente',
      html: `
        <h1>¡Funciona!</h1>
        <p>Resend está configurado correctamente en BoniMoney.</p>
      `
    });

    return !error;
  } catch {
    return false;
  }
}
