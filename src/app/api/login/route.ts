import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/auth-simple";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, RATE_LIMITS.LOGIN);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }

    const body = await request.json();
    const { email, password, rememberMe = true } = body;

    // Regular email/password authentication
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      // Audit failed login
      await auditLog.loginFailed(email, request, "User not found or no password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      // Audit failed login
      await auditLog.loginFailed(email, request, "Invalid password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session with remember me option
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      isAdmin: user.isAdmin,
    }, rememberMe);

    logger.info('Session created for user:', user.id, user.email);

    // Audit successful login
    await auditLog.loginSuccess(user.id, request);

    // Check if user is an owner/admin to enable device mode
    const membership = await prisma.membership.findFirst({
      where: { 
        userId: user.id,
        isActive: true,
        role: { in: ["OWNER", "ADMIN"] },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      canEnableDeviceMode: !!membership,
      company: membership?.company,
    });
  } catch (error) {
    return handleApiError(error, 'Auth/Login');
  }
}

