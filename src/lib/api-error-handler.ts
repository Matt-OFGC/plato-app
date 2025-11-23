import { NextResponse } from 'next/server';

/**
 * Standardized API error handling
 * Provides consistent error responses across all API routes
 */

interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
  context?: string;
  timestamp: string;
}

/**
 * Handle API errors with consistent formatting and logging
 */
export function handleApiError(error: unknown, context: string): NextResponse<ErrorResponse> {
  // Log error for debugging
  console.error(`[${context}] Error:`, error);

  // Handle different error types
  if (error instanceof Error) {
    // Prisma errors
    if ('code' in error && typeof error.code === 'string') {
      const prismaError = error as any;
      
      // Unique constraint violation
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          {
            error: 'A record with this value already exists',
            message: prismaError.meta?.target 
              ? `Duplicate entry for: ${prismaError.meta.target.join(', ')}`
              : 'Duplicate entry',
            code: prismaError.code,
            context,
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
      
      // Record not found
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          {
            error: 'Record not found',
            message: prismaError.meta?.cause || 'The requested record does not exist',
            code: prismaError.code,
            context,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }
      
      // Foreign key constraint
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          {
            error: 'Invalid reference',
            message: 'The referenced record does not exist',
            code: prismaError.code,
            context,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }
    
    // Validation errors
    if (error.message.includes('required') || error.message.includes('invalid')) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: error.message,
          context,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Authentication/Authorization errors
    if (error.message.includes('unauthorized') || error.message.includes('forbidden') || error.message.includes('permission')) {
      return NextResponse.json(
        {
          error: 'Authorization error',
          message: error.message,
          context,
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }
  }
  
  // Generic error response
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
      context,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}







