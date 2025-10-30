// Sentry utilities for common error handling patterns
// Provides consistent error reporting across the application

import { captureException, captureMessage, addBreadcrumb, setUserContext, setCompanyContext } from '../sentry.client.config';

// API error handler
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: {
    operation: string;
    userId?: number;
    companyId?: number;
    additionalData?: any;
  }
): Promise<T | null> {
  try {
    addBreadcrumb(`Starting ${context?.operation || 'operation'}`, 'user', context?.additionalData);
    
    const result = await operation();
    
    addBreadcrumb(`Completed ${context?.operation || 'operation'}`, 'user', {
      success: true,
      ...context?.additionalData,
    });
    
    return result;
  } catch (error) {
    console.error(`Error in ${context?.operation || 'operation'}:`, error);
    
    // Set user context if available
    if (context?.userId) {
      setUserContext({
        id: context.userId,
        email: '', // Will be set by the calling code
        companyId: context.companyId,
      });
    }
    
    // Set company context if available
    if (context?.companyId) {
      setCompanyContext({
        id: context.companyId,
        name: '', // Will be set by the calling code
      });
    }
    
    // Capture the error
    captureException(error as Error, {
      operation: context?.operation,
      userId: context?.userId,
      companyId: context?.companyId,
      ...context?.additionalData,
    });
    
    return null;
  }
}

// Form submission error handler
export function handleFormError(error: Error, formName: string, userId?: number) {
  addBreadcrumb(`Form submission failed: ${formName}`, 'user', {
    formName,
    userId,
    errorMessage: error.message,
  });
  
  captureException(error, {
    form: {
      name: formName,
      userId,
    },
  });
}

// Database operation error handler
export function handleDatabaseError(error: Error, operation: string, table?: string) {
  addBreadcrumb(`Database operation failed: ${operation}`, 'database', {
    operation,
    table,
    errorMessage: error.message,
  });
  
  captureException(error, {
    database: {
      operation,
      table,
    },
  });
}

// Network request error handler
export function handleNetworkError(error: Error, url: string, method: string) {
  addBreadcrumb(`Network request failed: ${method} ${url}`, 'http', {
    url,
    method,
    errorMessage: error.message,
  });
  
  captureException(error, {
    network: {
      url,
      method,
    },
  });
}

// Authentication error handler
export function handleAuthError(error: Error, action: string, userId?: number) {
  addBreadcrumb(`Authentication error: ${action}`, 'auth', {
    action,
    userId,
    errorMessage: error.message,
  });
  
  captureException(error, {
    auth: {
      action,
      userId,
    },
  });
}

// Feature usage tracking
export function trackFeatureUsage(feature: string, userId: number, companyId: number, metadata?: any) {
  addBreadcrumb(`Feature used: ${feature}`, 'user', {
    feature,
    userId,
    companyId,
    ...metadata,
  });
  
  captureMessage(`Feature ${feature} used`, 'info', {
    feature,
    userId,
    companyId,
    ...metadata,
  });
}

// Performance tracking
export function trackPerformance(operation: string, duration: number, userId?: number) {
  addBreadcrumb(`Performance: ${operation}`, 'performance', {
    operation,
    duration,
    userId,
  });
  
  // Only capture slow operations
  if (duration > 1000) {
    captureMessage(`Slow operation: ${operation}`, 'warning', {
      operation,
      duration,
      userId,
    });
  }
}

// User action tracking
export function trackUserAction(action: string, userId: number, companyId: number, metadata?: any) {
  addBreadcrumb(`User action: ${action}`, 'user', {
    action,
    userId,
    companyId,
    ...metadata,
  });
}

// Error boundary helper
export function reportErrorBoundaryError(error: Error, errorInfo: any, componentName: string) {
  captureException(error, {
    react: {
      componentStack: errorInfo.componentStack,
    },
    errorBoundary: {
      componentName,
    },
  });
}

// Custom error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', { field });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, url?: string) {
    super(message, 'NETWORK_ERROR', { url });
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, operation?: string) {
    super(message, 'DATABASE_ERROR', { operation });
    this.name = 'DatabaseError';
  }
}

// Error reporting middleware for API routes
export function createErrorHandler(routeName: string) {
  return (error: Error, req?: any) => {
    addBreadcrumb(`API Error: ${routeName}`, 'http', {
      route: routeName,
      method: req?.method,
      url: req?.url,
      errorMessage: error.message,
    });
    
    captureException(error, {
      api: {
        route: routeName,
        method: req?.method,
        url: req?.url,
      },
    });
  };
}



