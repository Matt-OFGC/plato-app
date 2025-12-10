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
  const startTime = Date.now();
  logger.info('[Auth/Login] Login request started', { timestamp: new Date().toISOString() });
  
  try {
    const body = await request.json().catch(() => {
      throw new Error('Invalid request body');
    });
    const { email, password, rememberMe = true } = body;
    logger.info('[Auth/Login] Request body parsed', { email, timestamp: Date.now() - startTime });

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
      logger.info('[Auth/Login] Fetching user from database', { email, timestamp: Date.now() - startTime });
      const dbStartTime = Date.now();
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
      logger.info('[Auth/Login] User fetched', { userId: user?.id, dbTime: Date.now() - dbStartTime, timestamp: Date.now() - startTime });
    } catch (dbError) {
      logger.error('[Auth/Login] Database error fetching user', dbError);
      throw new Error('Database connection failed');
    }

    if (!user || !user.passwordHash) {
      // Audit failed login (non-blocking)
      auditLog.loginFailed(email, request, "User not found or no password").catch(err => {
        logger.warn('[Auth/Login] Failed to log failed login', err);
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    logger.info('[Auth/Login] Comparing password', { timestamp: Date.now() - startTime });
    const isValid = await bcrypt.compare(password, user.passwordHash);
    logger.info('[Auth/Login] Password comparison complete', { isValid, timestamp: Date.now() - startTime });

    if (!isValid) {
      // Audit failed login (non-blocking)
      auditLog.loginFailed(email, request, "Invalid password").catch(err => {
        logger.warn('[Auth/Login] Failed to log failed login', err);
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has MFA enabled (with timeout)
    let mfaDevice = null;
    let requiresMfa = false;
    try {
      const mfaPromise = getPrimaryMfaDevice(user.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MFA check timeout')), 3000)
      );
      mfaDevice = await Promise.race([mfaPromise, timeoutPromise]) as any;
      requiresMfa = !!mfaDevice && mfaDevice.isVerified;
    } catch (mfaError) {
      // Don't block login if MFA check fails or times out
      logger.warn('[Auth/Login] MFA check failed or timed out', mfaError);
      requiresMfa = false;
    }

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
    logger.info('[Auth/Login] Updating last login timestamp', { userId: user.id, timestamp: Date.now() - startTime });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    logger.info('[Auth/Login] Last login updated', { timestamp: Date.now() - startTime });

    // Check for suspicious activity (non-blocking - don't wait for it)
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Run suspicious activity check in background - don't block login
    checkSuspiciousActivity(user.id, ipAddress, userAgent).catch((suspiciousError) => {
      // Don't fail login if suspicious activity check fails
      logger.warn('[Auth/Login] Failed to check suspicious activity', suspiciousError);
    });

    // Create session with remember me option and request info for device tracking
    // Add timeout to prevent hanging
    logger.info('[Auth/Login] Creating session', { userId: user.id, timestamp: Date.now() - startTime });
    try {
      const sessionStartTime = Date.now();
      const sessionPromise = createSession({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: user.isAdmin,
      }, rememberMe, { headers: request.headers });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session creation timeout')), 5000)
      );
      
      await Promise.race([sessionPromise, timeoutPromise]);
      logger.info('[Auth/Login] Session created for user', { userId: user.id, email: user.email, sessionTime: Date.now() - sessionStartTime, timestamp: Date.now() - startTime });
    } catch (sessionError) {
      logger.error('[Auth/Login] Failed to create session', sessionError);
      throw sessionError; // Re-throw to be caught by outer catch
    }

    // Audit successful login (non-blocking)
    auditLog.loginSuccess(user.id, request).catch((auditError) => {
      // Don't fail login if audit logging fails
      logger.warn('[Auth/Login] Failed to log successful login', auditError);
    });

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
      logger.warn('[Auth/Login] Failed to fetch membership for device mode', membershipError);
    }

    // Build response safely
    const responseData = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
      },
      canEnableDeviceMode: !!membership,
      company: membership?.company || null,
    };

    logger.info('[Auth/Login] Login successful', { userId: user.id, totalTime: Date.now() - startTime });
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('[Auth/Login] Login route error', { error, totalTime: Date.now() - startTime });
    return handleApiError(error, 'Auth/Login');
  }
}

