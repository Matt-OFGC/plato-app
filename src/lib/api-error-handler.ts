import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Standardized API error handling utility
 * Provides consistent error responses across all API routes
 */

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

export class ApiErrorHandler {
  /**
   * Handle errors and return standardized error response
   */
  static handle(error: unknown, context?: string): NextResponse {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorDetails = error instanceof Error ? { stack: error.stack } : { error };

    // Log error with context
    if (context) {
      logger.error(`[${context}]`, errorMessage, errorDetails);
    } else {
      logger.error(errorMessage, errorDetails);
    }

    // Determine status code
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Unauthorized') || error.message.includes('not authenticated')) {
        statusCode = 401;
        errorCode = 'UNAUTHORIZED';
      } else if (error.message.includes('Forbidden') || error.message.includes('access denied')) {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
      } else if (error.message.includes('Not found') || error.message.includes('does not exist')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_EXCEEDED';
      }
    }

    // In production, don't expose stack traces
    const response: ApiError = {
      error: errorMessage,
      code: errorCode,
      ...(process.env.NODE_ENV === 'development' && { details: errorDetails }),
    };

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * Create standardized success response
   */
  static success(data: any, statusCode: number = 200): NextResponse {
    return NextResponse.json(data, { status: statusCode });
  }

  /**
   * Create validation error response
   */
  static validationError(message: string, fields?: Record<string, string[]>): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'VALIDATION_ERROR',
        fields,
      },
      { status: 400 }
    );
  }

  /**
   * Create unauthorized error response
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  /**
   * Create forbidden error response
   */
  static forbidden(message: string = 'Access denied'): NextResponse {
    return NextResponse.json(
      {
        error: message,
        code: 'FORBIDDEN',
      },
      { status: 403 }
    );
  }

  /**
   * Create not found error response
   */
  static notFound(resource: string = 'Resource'): NextResponse {
    return NextResponse.json(
      {
        error: `${resource} not found`,
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  /**
   * Create rate limit error response
   */
  static rateLimit(retryAfter?: number): NextResponse {
    const headers: Record<string, string> = {};
    if (retryAfter) {
      headers['Retry-After'] = String(retryAfter);
    }

    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      },
      { status: 429, headers }
    );
  }
}

// Convenience exports
export const handleApiError = ApiErrorHandler.handle.bind(ApiErrorHandler);
export const apiSuccess = ApiErrorHandler.success.bind(ApiErrorHandler);
export const apiValidationError = ApiErrorHandler.validationError.bind(ApiErrorHandler);
export const apiUnauthorized = ApiErrorHandler.unauthorized.bind(ApiErrorHandler);
export const apiForbidden = ApiErrorHandler.forbidden.bind(ApiErrorHandler);
export const apiNotFound = ApiErrorHandler.notFound.bind(ApiErrorHandler);
export const apiRateLimit = ApiErrorHandler.rateLimit.bind(ApiErrorHandler);

