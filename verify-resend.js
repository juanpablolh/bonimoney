import { Resend } from 'resend';

// Load environment variables manually
const apiKey = process.env.VITE_RESEND_API_KEY;
const fromEmail = process.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const testEmail = process.argv[2] || 'jp.le.hu@hotmail.com';

if (!apiKey) {
    console.error('❌ Error: VITE_RESEND_API_KEY no está definida en el entorno.');
    process.exit(1);
}

const resend = new Resend(apiKey);

async function testResend() {
    console.log('🧪 Probando configuración de Resend...');
    console.log(`📧 Enviando email de prueba a: ${testEmail}`);
    console.log(`📨 Remitente (From): ${fromEmail}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);

    try {
        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: testEmail,
            subject: '🎉 BoniMoney: Verificación de Producción Exitosa',
            html: `
                <h1>¡Funciona!</h1>
                <p>Resend y tu dominio <strong>bonimoney.com</strong> están configurados correctamente para BoniMoney.</p>
                <p>Este correo confirma que el envío desde <strong>${fromEmail}</strong> es válido.</p>
                <hr>
                <p><small>Enviado el: ${new Date().toLocaleString()}</small></p>
            `
        });

        if (error) {
            console.error('❌ Error al enviar:', error);
            process.exit(1);
        } else {
            console.log('\n✅ ¡Email enviado con éxito!');
            console.log('ID del mensaje:', data.id);
            console.log('📬 Revisa tu bandeja de entrada (y la carpeta de spam por si acaso).');
            process.exit(0);
        }
    } catch (err) {
        console.error('❌ Error inesperado:', err);
        process.exit(1);
    }
}

testResend();
