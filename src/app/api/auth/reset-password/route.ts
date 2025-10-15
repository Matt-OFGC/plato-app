import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { mapAuthError, createAuthErrorResponse, logAuthError, generateErrorId } from "@/lib/errors/auth-errors";

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
    // In a real implementation, you would send an email here
    // For now, we'll just log it and return success
    
    if (user) {
      console.log(`Password reset requested for: ${email}`);
      // TODO: Implement actual email sending here
      // await sendPasswordResetEmail(email, resetToken);
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
