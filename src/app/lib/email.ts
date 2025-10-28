// Email utilities
export async function sendEmail(to: string, subject: string, html: string) {
  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  console.log('Email would be sent:', { to, subject, html });
  return { success: true };
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const subject = 'Welcome to Plato!';
  const html = `
    <h1>Welcome to Plato, ${user.name}!</h1>
    <p>Thank you for joining us. You can now start managing your recipes and ingredients.</p>
  `;
  
  return sendEmail(user.email, subject, html);
}