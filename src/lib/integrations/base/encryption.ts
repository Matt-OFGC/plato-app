import crypto from "crypto";

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string, secretKey: string): string {
  if (!text) return text;

  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, secretKey: string): string {
  if (!encryptedData) return encryptedData;

  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(secretKey, 'salt', 32);

    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object's sensitive fields
 */
export function encryptCredentials(credentials: any, secretKey: string): any {
  if (!credentials) return credentials;

  const encrypted = { ...credentials };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'accessToken', 'refreshToken'];

  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field], secretKey);
    }
  }

  return encrypted;
}

/**
 * Decrypt an object's sensitive fields
 */
export function decryptCredentials(encryptedCredentials: any, secretKey: string): any {
  if (!encryptedCredentials) return encryptedCredentials;

  const decrypted = { ...encryptedCredentials };
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'accessToken', 'refreshToken'];

  for (const field of sensitiveFields) {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field], secretKey);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }

  return decrypted;
}

/**
 * Get encryption secret key from environment
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_SECRET_KEY || process.env.INTEGRATION_ENCRYPTION_KEY;

  if (!key) {
    console.warn('Encryption key not found in environment variables. Using default (INSECURE - DO NOT USE IN PRODUCTION)');
    return 'default-encryption-key-change-in-production';
  }

  return key;
}

/**
 * Hash sensitive data (one-way)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
