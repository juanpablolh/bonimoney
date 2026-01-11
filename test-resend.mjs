import { Resend } from 'resend';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resend = new Resend(process.env.VITE_RESEND_API_KEY);
const FROM_EMAIL = process.env.VITE_RESEND_FROM_EMAIL || 'onboarding@resend.dev';

async function testResend() {
    const testEmail = process.argv[2] || 'test@example.com';

    console.log('🧪 Testing Resend configuration...\n');
    console.log(`📧 Sending test email to: ${testEmail}`);
    console.log(`🔑 API Key: ${process.env.VITE_RESEND_API_KEY?.substring(0, 10)}...`);
    console.log(`📨 From: ${FROM_EMAIL}\n`);

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: testEmail,
            subject: '✅ Resend configurado correctamente - BoniMoney',
            html: `
        <h1>¡Funciona!</h1>
        <p>Resend está configurado correctamente en BoniMoney.</p>
        <ul>
          <li><strong>API Key:</strong> ${process.env.VITE_RESEND_API_KEY?.substring(0, 10)}...</li>
          <li><strong>From Email:</strong> ${FROM_EMAIL}</li>
          <li><strong>Test Date:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Ya puedes enviar magic links y invitaciones! 🎉</p>
      `
        });

        if (error) {
            console.error('❌ Error:', error);
            process.exit(1);
        }

        console.log('✅ Email sent successfully!');
        console.log('📬 Email ID:', data?.id);
        console.log('\nCheck your inbox for the test email.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.log('\nPlease check:');
        console.log('  1. VITE_RESEND_API_KEY is set correctly in .env');
        console.log('  2. VITE_RESEND_FROM_EMAIL is valid');
        console.log('  3. Your Resend account is active');
        process.exit(1);
    }
}

testResend();
