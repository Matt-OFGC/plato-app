// Sentry server configuration
// Handles error tracking and performance monitoring on the server side

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical server errors
    if (event.exception) {
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Database connection errors (common in development)
        if (error.message.includes('ECONNREFUSED') ||
            error.message.includes('Connection refused') ||
            error.message.includes('ENOTFOUND')) {
          return null;
        }
        
        // Prisma errors that are handled gracefully
        if (error.message.includes('Unique constraint failed') ||
            error.message.includes('Record to update not found')) {
          return null;
        }
        
        // Validation errors (expected user errors)
        if (error.message.includes('Validation error') ||
            error.message.includes('Invalid input')) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive data
    if (breadcrumb.category === 'http' && breadcrumb.data) {
      // Remove sensitive headers
      if (breadcrumb.data.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-forwarded-for'];
        sensitiveHeaders.forEach(header => {
          if (breadcrumb.data.headers[header]) {
            breadcrumb.data.headers[header] = '[Filtered]';
          }
        });
      }
      
      // Remove sensitive request body data
      if (breadcrumb.data.body) {
        try {
          const body = JSON.parse(breadcrumb.data.body);
          const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
          
          sensitiveFields.forEach(field => {
            if (body[field]) {
              body[field] = '[Filtered]';
            }
          });
          
          breadcrumb.data.body = JSON.stringify(body);
        } catch (e) {
          // If body is not JSON, leave it as is
        }
      }
    }
    
    return breadcrumb;
  },
  
  // Integration configuration
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
    new Sentry.Integrations.Prisma({ client: undefined }),
  ],
  
  // Release tracking
  release: process.env.SENTRY_RELEASE,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});

// Export Sentry for manual error reporting
export { Sentry };

// Helper functions for manual error reporting
export function captureException(error: Error, context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

export function setUserContext(user: { id: number; email: string; companyId?: number }) {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    companyId: user.companyId?.toString(),
  });
}

export function setCompanyContext(company: { id: number; name: string; subscription?: string }) {
  Sentry.setContext('company', {
    id: company.id,
    name: company.name,
    subscription: company.subscription,
  });
}

export function addBreadcrumb(message: string, category: string, data?: any) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// API route error handler wrapper
export function withSentryErrorHandler<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // Capture error with context
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'api_error');
        scope.setContext('api_route', {
          method: args[0]?.method || 'unknown',
          url: args[0]?.url || 'unknown',
        });
        Sentry.captureException(error);
      });
      
      throw error;
    }
  }) as T;
}



