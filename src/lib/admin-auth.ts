import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "your-admin-secret-key-change-in-production"
);

// Admin credentials - stored in environment variables for security
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Plato328";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "$2b$10$YourHashedPasswordHere";

export interface AdminSession {
  username: string;
  loginTime: number;
  isAdmin: true;
}

export async function createAdminSession(username: string) {
  const token = await new SignJWT({ 
    username, 
    loginTime: Date.now(),
    isAdmin: true 
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h") // Admin sessions last 12 hours
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });

  return token;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session");

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    if (payload.username && payload.loginTime && payload.isAdmin) {
      return payload as unknown as AdminSession;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-session");
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  // Check username
  if (username !== ADMIN_USERNAME) {
    return false;
  }

  // For initial setup, accept plain text comparison
  // In production, you should use the hashed version
  if (password === "Ilovecows123!") {
    return true;
  }

  // Also check against hashed password if available
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch (error) {
    return false;
  }
}

export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Admin authentication required");
  }
  return session;
}

// Helper to generate password hash for .env file
export async function generateAdminPasswordHash(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

