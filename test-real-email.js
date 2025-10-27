// Quick email test
const { sendEmail } = require('./src/lib/email');

async function testEmail() {
  console.log('🧪 Testing email with real Resend API...');
  
  try {
    const result = await sendEmail({
      to: 'matt@example.com', // Replace with your real email
      subject: 'Plato Email Test - Real API',
      html: '<h1>🎉 Email Test Successful!</h1><p>Your Resend API is working correctly!</p>',
      text: 'Email Test Successful! Your Resend API is working correctly!'
    });
    
    console.log('Result:', result);
    
    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Check your email inbox (and spam folder)');
    } else {
      console.log('❌ Email sending failed');
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
  }
}

testEmail();
