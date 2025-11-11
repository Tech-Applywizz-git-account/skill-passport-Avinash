// test-smtp.js
const nodemailer = require('nodemailer');

console.log('🧪 Testing SMTP Connection...');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'support@skillpassportai.com',
    pass: 'lppi zufm myrp vwlc'
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testSMTP() {
  try {
    console.log('🔧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: 'Skill Passport <support@skillpassportai.com>',
      to: 'support@skillpassportai.com', // Send test to yourself
      subject: 'Test Email - Skill Passport SMTP',
      text: 'This is a test email from Skill Passport SMTP setup.',
      html: '<h1>Test Email</h1><p>This is a test email from Skill Passport SMTP setup.</p>'
    });

    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('✅ SMTP configuration is working correctly!');

  } catch (error) {
    console.error('❌ SMTP test failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure 2FA is enabled on support@skillpassportai.com');
    console.log('2. Verify the app password is correct: lppi zufm myrp vwlc');
    console.log('3. Check if "Less secure app access" is enabled');
    console.log('4. Try generating a new app password');
  }
}

testSMTP();