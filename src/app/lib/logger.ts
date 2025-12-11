/**
 * Centralized logging utility
 * Provides structured logging with levels and environment-aware output
 * Replaces console.log/error/warn throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format log entry for output
   */
  private formatLog(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      context,
    };
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Don't log sensitive fields
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'session',
    ];

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }

    // Check if string contains sensitive patterns
    if (typeof data === 'string') {
      for (const field of sensitiveFields) {
        if (data.toLowerCase().includes(field.toLowerCase())) {
          return '[REDACTED - contains sensitive data]';
        }
      }
    }

    return data;
  }

  /**
   * Output log based on environment
   */
  private output(entry: LogEntry): void {
    // In production, only log warnings and errors
    if (this.isProduction && (entry.level === 'debug' || entry.level === 'info')) {
      return;
    }

    const prefix = `[${entry.level.toUpperCase()}]`;
    const context = entry.context ? `[${entry.context}]` : '';
    const timestamp = this.isDevelopment ? `[${entry.timestamp}]` : '';

    const logMessage = `${prefix}${context}${timestamp} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(logMessage, entry.data || '');
        }
        break;
      case 'info':
        if (this.isDevelopment) {
          console.info(logMessage, entry.data || '');
        }
        break;
      case 'warn':
        console.warn(logMessage, entry.data || '');
        break;
      case 'error':
        console.error(logMessage, entry.data || '');
        // In production, you might want to send to error tracking service
        // e.g., Sentry.captureException(entry.data);
        break;
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, data?: any, context?: string): void {
    this.output(this.formatLog('debug', message, data, context));
  }

  /**
   * Info level logging (development only)
   */
  info(message: string, data?: any, context?: string): void {
    this.output(this.formatLog('info', message, data, context));
  }

  /**
   * Warning level logging (all environments)
   */
  warn(message: string, data?: any, context?: string): void {
    this.output(this.formatLog('warn', message, data, context));
  }

  /**
   * Error level logging (all environments)
   */
  error(message: string, error?: any, context?: string): void {
    // Extract error details if it's an Error object
    const errorData = error instanceof Error 
      ? {
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
          name: error.name,
        }
      : error;

    this.output(this.formatLog('error', message, errorData, context));
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for TypeScript
export type { LogLevel };








