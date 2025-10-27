type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  duration?: number;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (this.isDevelopment) {
      console.log(JSON.stringify(entry));
    }

    // In production, you could send to a logging service
    // Example: sendToLoggingService(entry);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
      } : String(error),
    };
    this.log('error', message, errorContext);
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  // Performance monitoring
  async track<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.log('info', `Performance: ${name}`, { ...context, duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Performance: ${name} failed`, error, { ...context, duration: `${duration}ms` });
      throw error;
    }
  }

  // API request logging
  logRequest(method: string, path: string, status: number, duration: number) {
    this.log('info', `${method} ${path}`, {
      status,
      duration: `${duration}ms`,
    });
  }
}

export const logger = new Logger();
