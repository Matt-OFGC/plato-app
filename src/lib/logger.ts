/**
 * Centralized logging utility
 * 
 * Provides environment-aware logging that:
 * - Logs everything in development
 * - Only logs errors and warnings in production
 * - Can be easily replaced with external logging service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    if (isProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * Log API request/response for debugging
   */
  api(method: string, path: string, status?: number, duration?: number): void {
    if (this.shouldLog('debug')) {
      const statusEmoji = status 
        ? status >= 200 && status < 300 ? '✅' 
        : status >= 400 ? '❌' 
        : '⚠️'
        : '🔄';
      console.debug(
        `[API] ${statusEmoji} ${method} ${path}${status ? ` ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`
      );
    }
  }

  /**
   * Log database query for debugging
   */
  db(query: string, duration?: number): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DB] ${query}${duration ? ` (${duration}ms)` : ''}`);
    }
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    if (this.shouldLog('debug')) {
      const emoji = value > 1000 ? '🐌' : value > 500 ? '⚠️' : '⚡';
      console.debug(`[PERF] ${emoji} ${metric}: ${value}${unit}`);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for cases where you need a custom logger
export { Logger };

// Convenience exports for common use cases
export const log = logger.info.bind(logger);
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logDebug = logger.debug.bind(logger);



