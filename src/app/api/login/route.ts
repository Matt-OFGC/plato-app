import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/auth-simple";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/api-error-handler";
import { getPrimaryMfaDevice } from "@/lib/mfa/totp";
import { checkSuspiciousActivity } from "@/lib/security-alerts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => {
      throw new Error('Invalid request body');
    });
    const { email, password, rememberMe = true } = body;

    // Apply rate limiting (both IP and email-based)
    const rateLimitResult = rateLimit(request, RATE_LIMITS.LOGIN, { 
      email: email, 
      perEmail: true 
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }

    // Regular email/password authentication
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          isAdmin: true,
          isActive: true,
          lastLoginAt: true,
        },
      });
    } catch (dbError) {
      logger.error('Database error fetching user', dbError, 'Auth/Login');
      throw new Error('Database connection failed');
    }

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

    // Check if user has MFA enabled
    const mfaDevice = await getPrimaryMfaDevice(user.id);
    const requiresMfa = !!mfaDevice && mfaDevice.isVerified;

    if (requiresMfa) {
      // Return MFA challenge instead of creating session
      return NextResponse.json({
        success: true,
        requiresMfa: true,
        mfaType: mfaDevice.type,
        message: "MFA verification required",
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Check for suspicious activity
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    try {
      await checkSuspiciousActivity(user.id, ipAddress, userAgent);
    } catch (suspiciousError) {
      // Don't fail login if suspicious activity check fails
      logger.warn('Failed to check suspicious activity', suspiciousError, 'Auth/Login');
    }

    // Create session with remember me option and request info for device tracking
    try {
      await createSession({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: user.isAdmin,
      }, rememberMe, { headers: request.headers });

      logger.info('Session created for user', { userId: user.id, email: user.email }, 'Auth/Login');
    } catch (sessionError) {
      logger.error('Failed to create session', sessionError, 'Auth/Login');
      throw sessionError; // Re-throw to be caught by outer catch
    }

    // Audit successful login
    try {
      await auditLog.loginSuccess(user.id, request);
    } catch (auditError) {
      // Don't fail login if audit logging fails
      logger.warn('Failed to log successful login', auditError, 'Auth/Login');
    }

    // Check if user is an owner/admin to enable device mode
    let membership = null;
    try {
      membership = await prisma.membership.findFirst({
        where: { 
          userId: user.id,
          isActive: true,
          role: { in: ["OWNER", "ADMIN"] }, // Backward compatibility: OWNER maps to ADMIN
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
    } catch (membershipError) {
      // Don't fail login if membership query fails
      logger.warn('Failed to fetch membership for device mode', membershipError, 'Auth/Login');
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      canEnableDeviceMode: !!membership,
      company: membership?.company || null,
    });
  } catch (error) {
    return handleApiError(error, 'Auth/Login');
  }
}

