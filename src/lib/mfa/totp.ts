// TOTP (Time-based One-Time Password) implementation
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

// Configure authenticator
authenticator.options = {
  step: 30, // 30 second windows
  window: [1, 1], // Allow 1 step before/after current
};

// Generate a secret for TOTP
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

// Generate QR code data URL for authenticator apps
export async function generateTotpQRCode(secret: string, email: string, issuer: string = 'Plato'): Promise<string> {
  const otpAuth = authenticator.keyuri(email, issuer, secret);
  
  try {
    // Generate QR code image
    const QRCode = (await import('qrcode')).default;
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuth);
    return qrCodeDataUrl;
  } catch (error) {
    // Fallback: return the otpauth URL
    console.warn('QR code generation failed, returning URL:', error);
    return otpAuth;
  }
}

// Verify TOTP token
export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    return authenticator.check(token, secret);
  } catch (error) {
    return false;
  }
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit backup codes
    const code = randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
    codes.push(code);
  }
  return codes;
}

// Hash backup codes for storage (use bcrypt in production)
export async function hashBackupCode(code: string): Promise<string> {
  // In production, use bcrypt or similar
  // For now, return a simple hash (not secure, but functional)
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Verify backup code
export async function verifyBackupCode(hashedCode: string, code: string): Promise<boolean> {
  const hash = await hashBackupCode(code);
  return hash === hashedCode;
}

// Create TOTP device for user
export async function createTotpDevice(
  userId: number,
  secret: string,
  name: string = 'Authenticator App'
): Promise<{ id: string; qrCode: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const qrCode = await generateTotpQRCode(secret, user.email);

  const device = await prisma.mfaDevice.create({
    data: {
      userId,
      type: 'totp',
      name,
      secret,
      isVerified: false,
      isPrimary: false,
    },
  });

  return {
    id: device.id,
    qrCode,
  };
}

// Verify and activate TOTP device
export async function verifyTotpDevice(deviceId: string, token: string): Promise<boolean> {
  const device = await prisma.mfaDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device || device.type !== 'totp' || !device.secret) {
    return false;
  }

  const isValid = verifyTotpToken(device.secret, token);

  if (isValid) {
    // Mark device as verified
    await prisma.mfaDevice.update({
      where: { id: deviceId },
      data: { isVerified: true },
    });
  }

  return isValid;
}

// Get primary MFA device for user
export async function getPrimaryMfaDevice(userId: number) {
  return prisma.mfaDevice.findFirst({
    where: {
      userId,
      isPrimary: true,
      isVerified: true,
    },
  });
}

// Set primary MFA device
export async function setPrimaryMfaDevice(userId: number, deviceId: string): Promise<void> {
  // Unset all other primary devices
  await prisma.mfaDevice.updateMany({
    where: {
      userId,
      isPrimary: true,
    },
    data: {
      isPrimary: false,
    },
  });

  // Set new primary device
  await prisma.mfaDevice.update({
    where: {
      id: deviceId,
      userId,
    },
    data: {
      isPrimary: true,
    },
  });
}

// Challenge user with MFA
export async function challengeMfa(userId: number, token: string): Promise<boolean> {
  const device = await getPrimaryMfaDevice(userId);

  if (!device || device.type !== 'totp' || !device.secret) {
    return false;
  }

  return verifyTotpToken(device.secret, token);
}

