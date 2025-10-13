import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

// JWT_SECRET must be set in environment variables
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface SessionUser {
  id: number;
  email: string;
  name?: string;
  isAdmin?: boolean;
}

export async function createSession(user: SessionUser, rememberMe: boolean = true) {
  // If remember me is checked, session lasts 30 days, otherwise 24 hours
  const expirationDays = rememberMe ? 30 : 1;
  const expirationSeconds = 60 * 60 * 24 * expirationDays;
  
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${expirationDays}d`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // Changed from "lax" to "strict" for better CSRF protection
    maxAge: expirationSeconds,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return payload.user as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUserFromSession() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { preferences: true },
  });

  return user;
}

