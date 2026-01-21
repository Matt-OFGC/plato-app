import { NextRequest, NextResponse } from "next/server";

// Structured auth error object used by API routes
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
  errorId?: string;
  details?: any;
}

/**
 * Normalise errors coming from Prisma, Zod, custom errors, etc. into a consistent shape.
 */
export function mapAuthError(error: any, errorId?: string): AuthError {
  const base: AuthError = {
    message: "An unexpected error occurred. Please try again.",
    code: "UNKNOWN_ERROR",
    status: 500,
    errorId,
  };

  if (!error) {
    return base;
  }

  // Prisma unique constraint (e.g. email already exists)
  if (error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
    if (target.includes("email")) {
      return {
        message: "An account with this email already exists. Please sign in instead.",
        code: "USER_EXISTS",
        status: 409,
        errorId,
      };
    }
    if (target.includes("slug")) {
      return {
        message: "This company name is already taken. Please try a different name.",
        code: "SLUG_EXISTS",
        status: 409,
        errorId,
      };
    }
    return {
      message: "This information is already in use. Please try different details.",
      code: "CONFLICT",
      status: 409,
      errorId,
    };
  }

  // Prisma not found
  if (error.code === "P2025") {
    return {
      message: "User not found.",
      code: "NOT_FOUND",
      status: 404,
      errorId,
    };
  }

  const message = typeof error === "string" ? error : error.message;

  if (message?.includes("Invalid credentials")) {
    return {
      message: "Invalid email or password.",
      code: "INVALID_CREDENTIALS",
      status: 401,
      errorId,
    };
  }

  if (message?.includes("Email not verified")) {
    return {
      message: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      status: 403,
      errorId,
    };
  }

  if (message?.includes("Account locked")) {
    return {
      message: "Account is temporarily locked. Please try again later.",
      code: "ACCOUNT_LOCKED",
      status: 423,
      errorId,
    };
  }

  return {
    ...base,
    message: message || base.message,
    code: error.code || base.code,
  };
}

/**
 * Build a JSON error response the API routes can return directly.
 */
export function createAuthErrorResponse(authError: AuthError, status: number = 400) {
  return NextResponse.json(
    {
      error: authError.message,
      code: authError.code || "AUTH_ERROR",
      errorId: authError.errorId,
      details: authError.details,
      timestamp: new Date().toISOString(),
    },
    { status: authError.status || status }
  );
}

/**
 * Centralised auth error logging so we always capture useful metadata.
 */
export function logAuthError(error: any, context: string, errorId?: string, req?: NextRequest) {
  console.error(`Auth error in ${context}:`, {
    message: error?.message ?? String(error),
    code: error?.code,
    stack: error?.stack,
    errorId,
    path: req?.nextUrl?.pathname,
    timestamp: new Date().toISOString(),
  });
}

export function generateErrorId(): string {
  return Math.random().toString(36).substr(2, 9);
}