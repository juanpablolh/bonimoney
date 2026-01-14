import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "BoniMoney <noreply@getlemoni.app>";

interface InvitationEmailRequest {
  to: string;
  inviterName: string;
  projectName: string;
  projectIcon: string;
  invitationLink: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { to, inviterName, projectName, invitationLink }: InvitationEmailRequest = await req.json();

    if (!to || !inviterName || !projectName || !invitationLink) {
      throw new Error("Missing required fields");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: `${inviterName} te invitó a "${projectName}" en BoniMoney`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invitación a proyecto - Bonimoney</title>
    <!--[if !mso]><!-->
    <style>
        @media screen and (max-width: 600px) {
            .content-table {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            .header-td {
                padding-left: 24px !important;
                height: 140px !important;
                border-radius: 0 !important;
            }
            .body-content {
                padding: 32px 24px !important;
            }
            .logo-text {
                font-size: 28px !important;
            }
        }
    </style>
    <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #EDEFEB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #EDEFEB;">
        <tr>
            <td align="center" style="padding: 20px;">
                <!-- Wrapper div for border-radius clipping -->
                <div style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; border: 1px solid #E5E5E5;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="content-table" style="background-color: #ffffff;">
                        <!-- Header -->
                        <tr>
                            <td class="header-td" align="left" valign="middle" style="background-color: #431407; background-image: url('https://bonimoney.com/bg-bonimoney.webp'); background-size: cover; background-position: center; height: 180px; padding-left: 48px;">
                                <span class="logo-text" style="font-family: Georgia, 'Times New Roman', serif; font-size: 38px; color: #EDEFEB; letter-spacing: -1px; font-weight: 400;">
                                    Bonimoney
                                </span>
                            </td>
                        </tr>
                        <!-- Body Content -->
                        <tr>
                            <td class="body-content" align="left" style="padding: 48px; background-color: #ffffff;">
                                <p style="font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #000000; margin: 0 0 24px 0;">
                                    ¡Hola!
                                </p>

                                <h2 style="font-family: Georgia, 'Times New Roman', serif; font-size: 18px; color: #000000; margin: 0 0 16px 0; font-weight: 400;">
                                    Te invitaron a un proyecto
                                </h2>

                                <p style="font-size: 14px; color: #737373; line-height: 1.5; margin: 0 0 24px 0;">
                                    <strong style="color: #000000;">${inviterName}</strong> te invitó a unirte al proyecto <strong style="color: #000000;">"${projectName}"</strong> en Bonimoney.
                                </p>

                                <p style="margin: 0 0 24px 0;">
                                    <a href="${invitationLink}" style="color: #064E3B; text-decoration: underline; font-weight: 500; font-size: 16px;">Aceptar invitación</a>
                                </p>

                                <p style="font-size: 14px; color: #737373; line-height: 1.5; margin: 0 0 32px 0;">
                                    Si no esperabas esta invitación, puedes ignorar este mensaje de forma segura.
                                </p>

                                <p style="font-size: 14px; color: #737373; line-height: 1.5; margin: 0;">
                                    Saludos,<br>
                                    <strong style="color: #000000; font-weight: 500;">Equipo Bonimoney</strong>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, id: responseData.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
