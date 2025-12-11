import { logger } from "@/lib/logger";

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a Prisma operation with exponential backoff
 */
export async function retryPrisma<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 100,
    backoff = true,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a retryable error
      const isRetryable = isRetryableError(lastError);

      if (!isRetryable || attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with optional exponential backoff
      const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;

      logger.warn(
        `Prisma operation failed, retrying (attempt ${attempt}/${maxAttempts})`,
        {
          error: lastError.message,
          attempt,
          maxAttempts,
          delay,
        },
        'Retry'
      );

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Retryable Prisma errors
  const retryablePatterns = [
    'timeout',
    'connection',
    'deadlock',
    'serialization',
    'transaction',
    'lock',
    'p2024', // Timed out fetching a new connection
    'p2034', // Transaction failed
    'p1001', // Can't reach database
    'p1002', // Database timeout
    'p1008', // Operations timed out
    'p1017', // Server has closed the connection
  ];

  return retryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
