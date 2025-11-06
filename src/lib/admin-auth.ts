import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

// Admin JWT configuration
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || 'admin-fallback-secret-change-in-production';
const ADMIN_ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const ADMIN_REFRESH_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours
const ADMIN_SESSION_COOKIE_NAME = 'admin-session';
const ADMIN_REFRESH_COOKIE_NAME = 'admin-refresh-token';

export interface AdminSession {
  username: string;
  email: string;
  userId: number;
  isAdmin: boolean;
  createdAt: number;
}

// Get admin JWT secret key
function getAdminSecretKey() {
  return new TextEncoder().encode(ADMIN_JWT_SECRET);
}

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Create admin access token (short-lived JWT)
async function createAdminAccessToken(session: AdminSession): Promise<string> {
  const secret = getAdminSecretKey();
  const token = await new SignJWT({
    username: session.username,
    email: session.email,
    userId: session.userId,
    isAdmin: true,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_ACCESS_TOKEN_EXPIRY}s`)
    .sign(secret);

  return token;
}

// Verify admin access token
async function verifyAdminAccessToken(token: string): Promise<AdminSession | null> {
  try {
    const secret = getAdminSecretKey();
    const { payload } = await jwtVerify(token, secret);
    
    return {
      username: payload.username as string,
      email: payload.email as string,
      userId: payload.userId as number,
      isAdmin: true,
      createdAt: payload.iat ? payload.iat * 1000 : Date.now(),
    };
  } catch (error) {
    return null;
  }
}

// Verify admin credentials - check database admin users with bcrypt
export async function verifyAdminCredentials(username: string, password: string): Promise<AdminSession | null> {
  try {
    // Find admin user in database
    const user = await prisma.user.findFirst({
      where: {
        email: username.toLowerCase().trim(),
        isAdmin: true,
        isActive: true,
      },
    });
    
    if (!user) {
      // Check fallback admin credentials from env (for initial setup)
      const fallbackUsername = process.env.ADMIN_USERNAME;
      const fallbackPassword = process.env.ADMIN_PASSWORD;
      
      if (fallbackUsername && fallbackPassword && username === fallbackUsername && password === fallbackPassword) {
        // Return a temporary session for fallback admin
        // In production, you should create a proper admin user in the database
        return {
          username: fallbackUsername,
          email: fallbackUsername,
          userId: 0, // Special ID for fallback admin
          isAdmin: true,
          createdAt: Date.now(),
        };
      }
      
      return null;
    }
    
    // If user has no password hash, deny access
    if (!user.passwordHash) {
      return null;
    }
    
    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }
    
    return {
      username: user.email,
      email: user.email,
      userId: user.id,
      isAdmin: true,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Admin credential verification error:', error);
    return null;
  }
}

// Create admin session with secure JWT tokens
export async function createAdminSession(session: AdminSession, request?: { headers: Headers }): Promise<void> {
  const cookieStore = await cookies();
  
  // Generate refresh token
  const refreshToken = generateToken();
  
  // Create access token
  const accessToken = await createAdminAccessToken(session);
  
  // Calculate expiration times
  const accessTokenExpires = new Date(Date.now() + ADMIN_ACCESS_TOKEN_EXPIRY * 1000);
  const refreshTokenExpires = new Date(Date.now() + ADMIN_REFRESH_TOKEN_EXPIRY * 1000);

  // Extract device info from request
  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request?.headers.get('x-real-ip') || 
                     'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';
  
  // Store session in database (only if userId is valid, skip for fallback admin)
  if (session.userId > 0) {
    await prisma.session.create({
      data: {
        userId: session.userId,
        token: accessToken,
        refreshToken: refreshToken,
        ipAddress: ipAddress,
        userAgent: userAgent,
        expiresAt: refreshTokenExpires,
        lastUsedAt: new Date(),
      },
    });
  }

  // Set access token cookie (short-lived)
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_ACCESS_TOKEN_EXPIRY,
    path: '/',
  });

  // Set refresh token cookie (long-lived)
  cookieStore.set(ADMIN_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_REFRESH_TOKEN_EXPIRY,
    path: '/',
  });
}

// Get admin session from access token or refresh token
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
    
    // Try to verify access token first
    if (accessToken) {
      const session = await verifyAdminAccessToken(accessToken);
      if (session) {
        // Verify session exists in database and is not revoked (skip for fallback admin)
        if (session.userId > 0) {
          const dbSession = await prisma.session.findFirst({
            where: {
              token: accessToken,
              userId: session.userId,
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
          });

          if (!dbSession) {
            return null;
          }

          // Update last used timestamp
          await prisma.session.update({
            where: { id: dbSession.id },
            data: { lastUsedAt: new Date() },
          });
        }

        return session;
      }
    }

    // Access token invalid or expired, try refresh token
    const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      return await refreshAdminSession(refreshToken);
    }

    return null;
  } catch (error) {
    console.error('Admin session error:', error);
    return null;
  }
}

// Refresh admin session using refresh token
async function refreshAdminSession(refreshToken: string): Promise<AdminSession | null> {
  try {
    // Find session by refresh token
    const session = await prisma.session.findFirst({
      where: {
        refreshToken: refreshToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isAdmin: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.user.isAdmin || !session.user.isActive) {
      return null;
    }

    // Create new admin session
    const adminSession: AdminSession = {
      username: session.user.email,
      email: session.user.email,
      userId: session.user.id,
      isAdmin: true,
      createdAt: Date.now(),
    };

    const newAccessToken = await createAdminAccessToken(adminSession);

    // Update session with new access token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        lastUsedAt: new Date(),
      },
    });

    // Set new access token cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_ACCESS_TOKEN_EXPIRY,
      path: '/',
    });

    return adminSession;
  } catch (error) {
    console.error('Refresh admin session error:', error);
    return null;
  }
}

// Destroy admin session (revoke in database and clear cookies)
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE_NAME)?.value;

  if (token) {
    // Revoke session in database
    await prisma.session.updateMany({
      where: {
        token: token,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  if (refreshToken) {
    // Also revoke by refresh token
    await prisma.session.updateMany({
      where: {
        refreshToken: refreshToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  // Clear cookies
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  cookieStore.delete(ADMIN_REFRESH_COOKIE_NAME);
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isAdmin || false;
}
