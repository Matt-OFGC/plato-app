import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { logger } from './logger';

export interface SessionUser {
  id: number;
  email: string;
  name?: string;
  isAdmin: boolean;
}

export interface Session {
  id: number;
  email: string;
  name?: string;
  isAdmin: boolean;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days
const SESSION_COOKIE_NAME = 'session';
const REFRESH_COOKIE_NAME = 'refresh_token';

// Get JWT secret key
function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Create access token (short-lived JWT)
async function createAccessToken(user: SessionUser): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRY}s`)
    .sign(secret);

  return token;
}

// Verify access token
async function verifyAccessToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.userId as number,
      email: payload.email as string,
      name: payload.name as string | undefined,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch (error) {
    return null;
  }
}

// Create a session for a user with database storage
export async function createSession(
  user: SessionUser,
  rememberMe: boolean = true,
  request?: { headers: Headers },
): Promise<void> {
  let cookieStore;
  try {
    // cookies() is async in Next.js 16
    cookieStore = await cookies();
  } catch (cookieError) {
    throw new Error(`Failed to access cookies: ${cookieError instanceof Error ? cookieError.message : 'Unknown error'}`);
  }
  
  // Generate refresh token
  const refreshToken = generateToken();
  
  // Create access token
  const accessToken = await createAccessToken(user);
  
  // Calculate expiration times
  const accessTokenExpires = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);
  const refreshTokenExpires = rememberMe
    ? new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day if not remember me

  // Extract device info from request
  const ipAddress = request?.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request?.headers.get('x-real-ip') || 
                     'unknown';
  const userAgent = request?.headers.get('user-agent') || 'unknown';
  
  // Store session in database
  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken: refreshToken,
      ipAddress: ipAddress,
      userAgent: userAgent,
      expiresAt: refreshTokenExpires,
      lastUsedAt: new Date(),
    },
  });

  // Set access token cookie (short-lived)
  cookieStore.set(SESSION_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_EXPIRY,
    path: '/',
  });

  // Set refresh token cookie (long-lived)
  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? REFRESH_TOKEN_EXPIRY : 24 * 60 * 60,
    path: '/',
  });
}

// Get current session from access token or refresh token
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    // Try to verify access token first
    if (accessToken) {
      const user = await verifyAccessToken(accessToken);
      if (user) {
        // Verify session exists in database and is not revoked
        const session = await prisma.session.findFirst({
          where: {
            token: accessToken,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        });

        if (session) {
          // Update last used timestamp
          await prisma.session.update({
            where: { id: session.id },
            data: { lastUsedAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
          };
        }
      }
    }

    // Access token invalid or expired, try refresh token
    const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
    if (refreshToken) {
      return await refreshSession(refreshToken);
    }

    return null;
  } catch (error) {
    logger.error('Session error', error, 'Auth/Session');
    return null;
  }
}

// Refresh session using refresh token
async function refreshSession(refreshToken: string): Promise<Session | null> {
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
            name: true,
            isAdmin: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !session.user.isActive) {
      return null;
    }

    // Create new access token
    const user: SessionUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
      isAdmin: session.user.isAdmin,
    };

    const newAccessToken = await createAccessToken(user);

    // Update session with new access token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        lastUsedAt: new Date(),
      },
    });

    // Try to set new access token cookie (only works in Route Handlers/Server Actions)
    // Silently fail if we're in a server component context
    try {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ACCESS_TOKEN_EXPIRY,
        path: '/',
      });
    } catch (cookieError) {
      // Cookies can only be modified in Route Handlers or Server Actions
      // This is expected when called from server components - the session is still refreshed in DB
      // The cookie will be set on the next request that goes through a Route Handler
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };
  } catch (error) {
    // Only log if it's not a cookie modification error (expected in server components)
    if (!(error instanceof Error && error.message.includes('Cookies can only be modified'))) {
      logger.error('Refresh session error', error, 'Auth/Session');
    }
    return null;
  }
}

// Get user from session (alias for getSession for backward compatibility)
export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return session;
}

// Destroy session (revoke in database and clear cookies)
export async function destroySession(sessionToken?: string): Promise<void> {
  const cookieStore = await cookies();
  
  // If no token provided, get from cookie
  const token = sessionToken || cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

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
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

// Revoke all sessions for a user
export async function revokeAllUserSessions(userId: number): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId: userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

// Verify session and get user with database data
export async function verifySession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Verify user still exists in database and is active
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    await destroySession();
    return null;
  }

  return user;
}

// Clean up expired sessions (call periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
