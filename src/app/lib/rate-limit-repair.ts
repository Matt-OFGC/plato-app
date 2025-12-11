/**
 * Rate limiting for repair operations
 * Prevents abuse and infinite repair loops
 */

const repairRateLimit = new Map<number, { count: number; resetAt: number }>();

const MAX_REPAIRS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Check rate limit for repair operations
 */
export async function checkRepairRateLimit(userId: number): Promise<{ allowed: boolean; resetAt?: number }> {
  const now = Date.now();
  const userLimit = repairRateLimit.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or initialize
    repairRateLimit.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= MAX_REPAIRS_PER_HOUR) {
    return {
      allowed: false,
      resetAt: userLimit.resetAt,
    };
  }

  // Increment count
  userLimit.count++;
  return { allowed: true };
}

/**
 * Get rate limit status for a user
 */
export function getRepairRateLimitStatus(userId: number): {
  currentCount: number;
  maxAllowed: number;
  resetAt: number | null;
  allowed: boolean;
} {
  const limit = repairRateLimit.get(userId);
  return {
    currentCount: limit?.count || 0,
    maxAllowed: MAX_REPAIRS_PER_HOUR,
    resetAt: limit?.resetAt || null,
    allowed: !limit || limit.count < MAX_REPAIRS_PER_HOUR,
  };
}
