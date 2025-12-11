import { logger } from "@/lib/logger";

/**
 * Rate limit status interface
 */
export interface RateLimitStatus {
  isLimited: boolean;
  remainingAttempts?: number;
  resetAt?: Date;
  message: string;
}

/**
 * Get the current rate limit status for repair operations
 * This is a simple in-memory rate limiter for administrative repair operations
 */
const repairAttempts = new Map<string, { count: number; resetAt: Date }>();

export function getRepairRateLimitStatus(identifier: string): RateLimitStatus {
  const now = new Date();
  const existing = repairAttempts.get(identifier);

  // Clear expired entries
  if (existing && existing.resetAt < now) {
    repairAttempts.delete(identifier);
  }

  const current = repairAttempts.get(identifier);

  if (!current) {
    return {
      isLimited: false,
      remainingAttempts: 10,
      message: 'No rate limit applied',
    };
  }

  const maxAttempts = 10;
  const isLimited = current.count >= maxAttempts;

  return {
    isLimited,
    remainingAttempts: Math.max(0, maxAttempts - current.count),
    resetAt: current.resetAt,
    message: isLimited
      ? `Rate limit exceeded. Try again after ${current.resetAt.toISOString()}`
      : `${maxAttempts - current.count} attempts remaining`,
  };
}

/**
 * Record a repair attempt
 */
export function recordRepairAttempt(identifier: string): void {
  const now = new Date();
  const existing = repairAttempts.get(identifier);

  // Clear expired entries
  if (existing && existing.resetAt < now) {
    repairAttempts.delete(identifier);
  }

  const current = repairAttempts.get(identifier);

  if (current) {
    current.count++;
  } else {
    // Set reset time to 1 hour from now
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000);
    repairAttempts.set(identifier, { count: 1, resetAt });
  }

  logger.info(
    `Repair attempt recorded for ${identifier}`,
    { count: repairAttempts.get(identifier)?.count },
    'RateLimit'
  );
}

/**
 * Clear rate limit for an identifier (admin override)
 */
export function clearRepairRateLimit(identifier: string): void {
  repairAttempts.delete(identifier);
  logger.info(`Rate limit cleared for ${identifier}`, {}, 'RateLimit');
}
