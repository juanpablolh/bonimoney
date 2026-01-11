import { testResendConfig } from './src/utils/email';

// Test Resend configuration
async function main() {
    console.log('🧪 Testing Resend configuration...\n');

    // Get test email from command line or use default
    const testEmail = process.argv[2] || 'test@example.com';

    console.log(`📧 Sending test email to: ${testEmail}`);
    console.log(`🔑 API Key: ${process.env.VITE_RESEND_API_KEY?.substring(0, 10)}...`);
    console.log(`📨 From: ${process.env.VITE_RESEND_FROM_EMAIL}\n`);

    const success = await testResendConfig(testEmail);

    if (success) {
        console.log('\n✅ Resend is configured correctly!');
        console.log('📬 Check your inbox for the test email.');
        process.exit(0);
    } else {
        console.log('\n❌ Resend test failed!');
        console.log('Please check:');
        console.log('  1. VITE_RESEND_API_KEY is set correctly in .env');
        console.log('  2. VITE_RESEND_FROM_EMAIL is valid');
        console.log('  3. Your Resend account is active');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
