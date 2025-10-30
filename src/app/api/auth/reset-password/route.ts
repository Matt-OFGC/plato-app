import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const errorId = generateErrorId();
  
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(req, RATE_LIMITS.LOGIN); // Reuse login rate limit
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

    const body = await req.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
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
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to prevent email enumeration
    // NOTE: Email sending is handled by the email service module
    // The actual reset token generation and email sending should be implemented
    // in lib/email.ts with sendPasswordResetEmail function
    
    if (user) {
      logger.info(`Password reset requested for: ${email}`);
      // TODO: Implement password reset token generation and email sending
      // This requires:
      // 1. Generate secure reset token (store in database with expiry)
      // 2. Call sendPasswordResetEmail(email, resetToken, resetUrl)
      // 3. The reset URL should point to /reset-password?token=...
      // See lib/email.ts for email service integration
    }
    
    return NextResponse.json({
      success: true,
      message: "If that email exists, we've sent a reset link. Check your inbox (and spam)."
    });
    
  } catch (error) {
    // Log the full error for debugging
    logAuthError(error, "password_reset", errorId, req);
    
    // Map to user-friendly error
    const authError = mapAuthError(error, errorId);
    return createAuthErrorResponse(authError);
  }
}
