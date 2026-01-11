import { Resend } from 'resend';

// Initialize Resend client
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

        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: isNewUser ? '🎉 Bienvenido a BoniMoney' : '🔐 Tu link de acceso a BoniMoney',
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
              <h1 style="color: white; margin: 0; font-size: 28px;">💰 BoniMoney</h1>
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
            console.error('Error sending magic link email:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Magic link email sent:', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending magic link email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send project invitation email
 */
export async function sendInvitationEmail(
    to: string,
    inviterName: string,
    projectName: string,
    projectIcon: string,
    invitationLink: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `📨 ${inviterName} te invitó a "${projectName}"`,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitación a ${projectName}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💰 BoniMoney</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea; margin-top: 0;">¡Tienes una invitación!</h2>
              
              <p><strong>${inviterName}</strong> te ha invitado a unirte al proyecto:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <div style="font-size: 32px; margin-bottom: 10px;">${projectIcon}</div>
                <h3 style="margin: 0; color: #333;">${projectName}</h3>
              </div>
              
              <p>Podrás ver y editar gastos, agregar miembros, y mantener todo organizado en un solo lugar.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                  Aceptar Invitación
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Si no conoces a ${inviterName} o no esperabas esta invitación, puedes ignorar este email de forma segura.
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
            console.error('Error sending invitation email:', error);
            return { success: false, error: error.message };
        }

        console.log('✅ Invitation email sent:', data);
        return { success: true };
    } catch (error) {
        console.error('Error sending invitation email:', error);
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
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: testEmail,
            subject: '✅ Resend configurado correctamente',
            html: `
        <h1>¡Funciona!</h1>
        <p>Resend está configurado correctamente en BoniMoney.</p>
        <p>API Key: ${import.meta.env.VITE_RESEND_API_KEY?.substring(0, 10)}...</p>
        <p>From Email: ${FROM_EMAIL}</p>
      `
        });

        if (error) {
            console.error('❌ Resend test failed:', error);
            return false;
        }

        console.log('✅ Resend test successful:', data);
        return true;
    } catch (error) {
        console.error('❌ Resend test error:', error);
        return false;
    }
}
