// Email utilities
export async function sendEmail(to: string, subject: string, html: string) {
  // In production, integrate with your email service (SendGrid, AWS SES, Resend, etc.)
  // Check if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Plato <noreply@plato.app>',
        to: [to],
        subject,
        html,
      });
      
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error('Resend email error:', error);
      // Fall through to console log in development
    }
  }
  
  // Development/fallback: log email
  if (process.env.NODE_ENV === 'development') {
    console.log('Email would be sent:', { to, subject, html });
  }
  
  return { success: true };
}

export async function sendWelcomeEmail(user: { name: string; email: string }) {
  const subject = 'Welcome to Plato!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Plato</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Welcome to Plato!</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${user.name},</p>
        <p>Thank you for joining Plato! You can now start managing your recipes and ingredients.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(user.email, subject, html);
}

export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetToken: string;
  resetUrl: string;
}) {
  const subject = 'Reset Your Plato Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Reset Your Password</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password for your Plato account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #059669; background: #f0fdf4; padding: 10px; border-radius: 4px;">${data.resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          For security reasons, never share this link with anyone.
        </p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(data.to, subject, html);
}

export async function sendEmailVerificationEmail(data: {
  to: string;
  name: string;
  verificationToken: string;
  verificationUrl: string;
}) {
  const subject = 'Verify Your Email Address';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Verify Your Email Address</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.name},</p>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #059669; background: #f0fdf4; padding: 10px; border-radius: 4px;">${data.verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(data.to, subject, html);
}

export async function sendTeamInviteEmail(data: {
  to: string;
  inviterName: string;
  companyName: string;
  inviteToken: string;
  inviteUrl: string;
}) {
  const subject = `You've been invited to join ${data.companyName} on Plato`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Team Invitation</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi,</p>
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.companyName}</strong> on Plato.</p>
        <p>Click the button below to accept the invitation:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.inviteUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Accept Invitation</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #059669; background: #f0fdf4; padding: 10px; border-radius: 4px;">${data.inviteUrl}</p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(data.to, subject, html);
}

export function generateOrderConfirmationEmail(data: {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  deliveryDate?: string;
}) {
  const subject = `Order Confirmation - ${data.orderNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Order Confirmation</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your order! Your order <strong>#${data.orderNumber}</strong> has been confirmed.</p>
        <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 6px;">
          ${data.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span>${item.name} x ${item.quantity}</span>
              <span>£${item.price.toFixed(2)}</span>
            </div>
          `).join('')}
          <div style="display: flex; justify-content: space-between; padding: 10px 0; font-weight: bold; margin-top: 10px;">
            <span>Total</span>
            <span>£${data.total.toFixed(2)}</span>
          </div>
        </div>
        ${data.deliveryDate ? `<p><strong>Estimated Delivery:</strong> ${data.deliveryDate}</p>` : ''}
        <p>We'll send you another email when your order ships.</p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}

export function generateOrderStatusEmail(data: {
  orderNumber: string;
  customerName: string;
  status: string;
  trackingNumber?: string;
  statusMessage?: string;
}) {
  const subject = `Order ${data.orderNumber} - ${data.status}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Status Update</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Order Status Update</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${data.customerName},</p>
        <p>Your order <strong>#${data.orderNumber}</strong> status has been updated to: <strong>${data.status}</strong></p>
        ${data.statusMessage ? `<p>${data.statusMessage}</p>` : ''}
        ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html };
}
