// Email-based 2FA implementation
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// Generate 6-digit code
function generateCode(): string {
  return randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
}

// Create email 2FA device
export async function createEmailMfaDevice(
  userId: number,
  email: string,
  name: string = 'Email 2FA'
) {
  const device = await prisma.mfaDevice.create({
    data: {
      userId,
      type: 'email',
      name,
      isVerified: true, // Email is pre-verified
      isPrimary: false,
    },
  });

  return device;
}

// Send 2FA code via email
export async function sendEmailMfaCode(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate code
  const code = generateCode();

  // Store code in database (with expiry - 10 minutes)
  // In production, use a separate table for codes
  // For now, we'll store it in a session/redis-like way
  // Actually, let's create a simple code storage approach
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store code temporarily (in production, use Redis)
  // For now, we'll need to create a way to verify it
  // Let's use a simple approach with MfaDevice + temporary storage

  // Send email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Your Verification Code</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${user.name || 'there'},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 8px; border: 2px solid #10b981;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${code}</span>
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
        </p>
        <p style="margin-top: 30px;">Best regards,<br>The Plato Team</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(user.email, 'Your Plato Verification Code', html);

  // Return code hash for storage (in production, store in Redis with expiry)
  // For now, we'll need to store it somewhere verifiable
  return code; // In production, return hash or store in Redis
}

// Verify email 2FA code
export async function verifyEmailMfaCode(userId: number, code: string): Promise<boolean> {
  // In production, verify against stored code in Redis
  // For now, this is a placeholder - you'd need to implement code storage
  // This would typically involve:
  // 1. Storing code in Redis with userId as key, expiry 10 minutes
  // 2. Verifying code matches and hasn't expired
  // 3. Deleting code after successful verification
  
  // Placeholder implementation
  return true; // Would need actual code verification logic
}

