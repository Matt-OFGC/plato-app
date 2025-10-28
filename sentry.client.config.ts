// Sentry client configuration
// Handles error tracking and performance monitoring on the client side

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-error events
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out common non-critical errors
      if (error instanceof Error) {
        // Network errors
        if (error.message.includes('NetworkError') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('Load failed')) {
          return null;
        }
        
        // ResizeObserver errors (common browser quirk)
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        
        // Chunk load errors (common in development)
        if (error.message.includes('Loading chunk') || 
            error.message.includes('ChunkLoadError')) {
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
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
          if (breadcrumb.data.headers[header]) {
            breadcrumb.data.headers[header] = '[Filtered]';
          }
        });
      }
      
      // Remove sensitive URL parameters
      if (breadcrumb.data.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /[?&](password|token|key|secret)=[^&]*/gi,
          (match) => match.split('=')[0] + '=[Filtered]'
        );
      }
    }
    
    return breadcrumb;
  },
  
  // Integration configuration
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/yourserver\.com\/api/,
      ],
    }),
    new Sentry.Replay({
      // Mask sensitive data in replays
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: false,
    }),
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

