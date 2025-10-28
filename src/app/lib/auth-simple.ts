import { cookies } from 'next/headers';
import { prisma } from './prisma';

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

// Create a session for a user
export async function createSession(user: SessionUser, rememberMe: boolean = true): Promise<void> {
  const cookieStore = await cookies();
  
  // Create session token (in production, use proper JWT or session tokens)
  const sessionToken = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    createdAt: Date.now()
  })).toString('base64');

  // Set cookie with appropriate expiration
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
  
  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/'
  });
}

// Get current session
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Decode session token
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    
    // Check if session is expired (30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (sessionData.createdAt < thirtyDaysAgo) {
      return null;
    }

    return {
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name,
      isAdmin: sessionData.isAdmin
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

// Get user from session (alias for getSession for backward compatibility)
export async function getUserFromSession(): Promise<SessionUser | null> {
  const session = await getSession();
  return session;
}

// Destroy session
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

// Verify session and get user with database data
export async function verifySession(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  // Verify user still exists in database
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    await destroySession();
    return null;
  }

  return user;
}
