import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { requestPasswordResetSchema, completePasswordResetSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";
import { validatePasswordStrength } from "@/lib/password-policy";
import { randomBytes } from "crypto";

// Request password reset (POST with email)
export async function POST(req: NextRequest) {
  const errorId = generateErrorId();
  
  try {
    const body = await req.json();
    
    // Apply rate limiting (both IP and email-based for requests)
    const rateLimitResult = rateLimit(req, RATE_LIMITS.PASSWORD_RESET, { 
      email: body.email, 
      perEmail: true 
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: `Too many password reset attempts. Please try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
          code: "RATE_LIMITED",
          errorId,
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }
    
    // Check if this is a request (email only) or completion (token + password)
    if (body.token && body.password) {
      // Complete password reset
      return handlePasswordResetCompletion(body, errorId);
    } else if (body.email) {
      // Request password reset
      return handlePasswordResetRequest(body, req, errorId);
    } else {
      return NextResponse.json({
        error: "Either email (for request) or token+password (for completion) is required",
        code: "VALIDATION_ERROR",
        errorId,
      }, { status: 400 });
    }
  } catch (error) {
    // Log the full error for debugging
    logAuthError(error, "password_reset", errorId, req);
    
    // Map to user-friendly error
    const authError = mapAuthError(error, errorId);
    return createAuthErrorResponse(authError);
  }
}

// Handle password reset request (generate token and send email)
async function handlePasswordResetRequest(
  body: any,
  req: NextRequest,
  errorId: string
): Promise<NextResponse> {
  // Validate input
  const validationResult = requestPasswordResetSchema.safeParse(body);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return NextResponse.json({
      error: firstError.message,
      code: "VALIDATION_ERROR",
      errorId,
      field: firstError.path[0]
    }, { status: 400 });
  }
  
  const { email } = validationResult.data;
  
  // Check if user exists (but don't reveal this information)
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  
  // Always return success to prevent email enumeration
  if (user) {
    // Generate secure reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiresAt: expiresAt,
      },
    });
    
    logger.info(`Password reset token generated for user: ${user.id} (${email})`);
    
    // Send password reset email
    try {
      const resetUrl = `${req.nextUrl.origin}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail({
        to: email,
        name: user.name || 'there',
        resetToken,
        resetUrl,
      });
      logger.debug(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error("Failed to send password reset email:", emailError);
      // Don't fail the request if email fails - token is still generated
    }
  }
  
  return NextResponse.json({
    success: true,
    message: "If that email exists, we've sent a reset link. Check your inbox (and spam)."
  });
}

// Handle password reset completion (validate token and update password)
async function handlePasswordResetCompletion(
  body: any,
  errorId: string
): Promise<NextResponse> {
  // Validate input
  const validationResult = completePasswordResetSchema.safeParse(body);
  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return NextResponse.json({
      error: firstError.message,
      code: "VALIDATION_ERROR",
      errorId,
      field: firstError.path[0]
    }, { status: 400 });
  }
  
  const { token, password } = validationResult.data;
  
  // Validate password strength
  const passwordStrength = validatePasswordStrength(password);
  if (!passwordStrength.meetsRequirements) {
    return NextResponse.json({
      error: passwordStrength.feedback.join(', '),
      code: "WEAK_PASSWORD",
      errorId,
      feedback: passwordStrength.feedback,
    }, { status: 400 });
  }
  
  // Find user with this reset token
  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token },
  });
  
  if (!user) {
    return NextResponse.json({
      error: "Invalid or expired reset token",
      code: "INVALID_TOKEN",
      errorId,
    }, { status: 400 });
  }
  
  // Check if token has expired
  if (!user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt < new Date()) {
    return NextResponse.json({
      error: "Reset token has expired. Please request a new one.",
      code: "TOKEN_EXPIRED",
      errorId,
    }, { status: 400 });
  }
  
  // Hash new password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Update user password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    },
  });
  
  logger.info(`Password reset completed for user: ${user.id} (${user.email})`);
  
  // Revoke all existing sessions for security
  await prisma.session.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
  
  return NextResponse.json({
    success: true,
    message: "Password has been reset successfully. You can now log in with your new password."
  });
}
