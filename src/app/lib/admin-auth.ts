import { cookies } from 'next/headers';

// Admin credentials (in production, store these securely)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

export interface AdminSession {
  username: string;
  isAdmin: boolean;
  createdAt: number;
}

// Verify admin credentials
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

// Create admin session
export async function createAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  
  // Create admin session token
  const sessionToken = Buffer.from(JSON.stringify({
    username,
    isAdmin: true,
    createdAt: Date.now()
  })).toString('base64');

  // Set cookie with 24 hour expiration
  cookieStore.set('admin-session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });
}

// Get admin session
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    // Decode session token
    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
    
    // Check if session is expired (24 hours)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    if (sessionData.createdAt < twentyFourHoursAgo) {
      return null;
    }

    return {
      username: sessionData.username,
      isAdmin: sessionData.isAdmin,
      createdAt: sessionData.createdAt
    };
  } catch (error) {
    console.error('Admin session error:', error);
    return null;
  }
}

// Destroy admin session
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.isAdmin || false;
}
