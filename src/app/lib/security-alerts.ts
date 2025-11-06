// Security alerts and notifications
import { prisma } from './prisma';
import { sendEmail } from './email';

export interface SecurityEvent {
  type: 'new_device' | 'password_change' | 'suspicious_login' | 'failed_login_attempts' | 'mfa_enabled' | 'mfa_disabled';
  userId: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Send security alert email
export async function sendSecurityAlert(userId: number, event: SecurityEvent) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return;
  }

  const eventMessages: Record<SecurityEvent['type'], { subject: string; message: string }> = {
    new_device: {
      subject: 'New Device Login Detected',
      message: `We noticed a login from a new device. If this wasn't you, please secure your account immediately.`,
    },
    password_change: {
      subject: 'Password Changed',
      message: `Your password has been changed. If you didn't make this change, please secure your account immediately.`,
    },
    suspicious_login: {
      subject: 'Suspicious Login Activity',
      message: `We detected unusual login activity on your account. Please review your account security.`,
    },
    failed_login_attempts: {
      subject: 'Multiple Failed Login Attempts',
      message: `We detected multiple failed login attempts on your account. If this wasn't you, your account may be under attack.`,
    },
    mfa_enabled: {
      subject: 'Multi-Factor Authentication Enabled',
      message: `Multi-factor authentication has been enabled on your account. This will help keep your account secure.`,
    },
    mfa_disabled: {
      subject: 'Multi-Factor Authentication Disabled',
      message: `Multi-factor authentication has been disabled on your account. If you didn't make this change, please secure your account immediately.`,
    },
  };

  const eventInfo = eventMessages[event.type];
  if (!eventInfo) {
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Security Alert</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${user.name || 'there'},</p>
        <p><strong>${eventInfo.subject}</strong></p>
        <p>${eventInfo.message}</p>
        ${event.ipAddress ? `<p><strong>IP Address:</strong> ${event.ipAddress}</p>` : ''}
        ${event.userAgent ? `<p><strong>Device:</strong> ${event.userAgent}</p>` : ''}
        <p style="margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/account" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Review Account Security</a>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          If you didn't perform this action, please secure your account immediately by changing your password and reviewing your active sessions.
        </p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Security Team</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(user.email, eventInfo.subject, html);
}

// Check for suspicious activity
export async function checkSuspiciousActivity(userId: number, ipAddress: string, userAgent: string): Promise<boolean> {
  // Get recent sessions for this user
  const recentSessions = await prisma.session.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    select: {
      ipAddress: true,
    },
  });

  // Check if IP address is new
  const isNewIp = !recentSessions.some(s => s.ipAddress === ipAddress);

  if (isNewIp) {
    // Send alert for new device/IP
    await sendSecurityAlert(userId, {
      type: 'new_device',
      userId,
      ipAddress,
      userAgent,
    });
    return true;
  }

  return false;
}

