import { NextResponse } from "next/server";

// Error types for authentication
export type AuthErrorCode = 
  | "EMAIL_ALREADY_EXISTS"
  | "WEAK_PASSWORD"
  | "INVALID_CREDENTIALS"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UNKNOWN_ERROR";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  status: number;
  errorId?: string;
}

// Generate a short error ID for support purposes
export function generateErrorId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Map database/API errors to user-friendly messages
export function mapAuthError(error: any, errorId: string): AuthError {
  const errorMessage = error?.message || error?.toString() || "Unknown error";
  
  // Check for specific error patterns
  if (errorMessage.includes("Unique constraint") || errorMessage.includes("duplicate key")) {
    return {
      code: "EMAIL_ALREADY_EXISTS",
      message: "That email is already registered. Try logging in or reset your password.",
      status: 409,
      errorId,
    };
  }
  
  if (errorMessage.includes("password") && errorMessage.includes("weak")) {
    return {
      code: "WEAK_PASSWORD", 
      message: "Please choose a stronger password (8+ chars incl. a number).",
      status: 400,
      errorId,
    };
  }
  
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
    return {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again later.",
      status: 429,
      errorId,
    };
  }
  
  if (errorMessage.includes("network") || errorMessage.includes("connection")) {
    return {
      code: "NETWORK_ERROR",
      message: "We couldn't complete your request. Please check your connection and try again.",
      status: 500,
      errorId,
    };
  }
  
  // Default to unknown error
  return {
    code: "UNKNOWN_ERROR",
    message: "We couldn't complete sign-up. Please try again.",
    status: 500,
    errorId,
  };
}

// Create a standardized error response
export function createAuthErrorResponse(authError: AuthError): NextResponse {
  return NextResponse.json(
    {
      error: authError.message,
      code: authError.code,
      errorId: authError.errorId,
    },
    { status: authError.status }
  );
}

// Log error with context for debugging
export function logAuthError(error: any, context: string, errorId: string, request?: any) {
  const logData = {
    errorId,
    context,
    message: error?.message || error?.toString(),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: request?.headers?.get?.("user-agent"),
    ip: request?.ip || request?.headers?.get?.("x-forwarded-for"),
  };
  
  console.error(`[AUTH_ERROR:${errorId}]`, logData);
  
  // In production, you might want to send this to a logging service like Sentry
  // Sentry.captureException(error, { tags: { errorId, context } });
}
