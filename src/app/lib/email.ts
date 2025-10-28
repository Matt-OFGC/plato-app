// Email utilities
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // In production, integrate with email service like SendGrid, Resend, etc.
  console.log('Email would be sent:', { to, subject, html });
  
  // For now, just log the email
  console.log(`📧 Email to ${to}: ${subject}`);
}

export async function sendWelcomeEmail(userEmail: string, userName: string, companyName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #059669;">Welcome to Plato!</h1>
      <p>Hi ${userName},</p>
      <p>Welcome to Plato! Your account for ${companyName} has been created successfully.</p>
      <p>You can now start managing your ingredients and recipes with automatic cost calculation.</p>
      <p>Best regards,<br>The Plato Team</p>
    </div>
  `;
  
  await sendEmail(userEmail, 'Welcome to Plato!', html);
}

export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #059669;">Password Reset Request</h1>
      <p>You requested a password reset for your Plato account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  
  await sendEmail(userEmail, 'Password Reset Request', html);
}

export async function sendEmailVerificationEmail(userEmail: string, verificationToken: string): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #059669;">Verify Your Email</h1>
      <p>Please verify your email address to complete your Plato account setup.</p>
      <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;
  
  await sendEmail(userEmail, 'Verify Your Email', html);
}
