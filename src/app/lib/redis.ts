/**
 * Redis cache utilities
 * Note: This is a placeholder implementation. In production, you would use a real Redis client.
 * Updated: 2024-12-21 - Fixed CacheKeys.userRole and removed initRedis/getCache
 * Updated: 2025-01-22 - Removed "use server" directive to fix Turbopack import issues
 */

export const CacheKeys = {
  userSession: (userId: number) => `user:session:${userId}`,
  userCompanies: (userId: number) => `user:companies:${userId}`,
  company: (companyId: number) => `company:${companyId}`,
  userRole: (userId: number, companyId: number) => `user:role:${userId}:${companyId}`,
};

export const CACHE_TTL = {
  USER_SESSION: 15 * 60 * 1000, // 15 minutes
  USER_COMPANIES: 30 * 60 * 1000, // 30 minutes
  COMPANY: 60 * 60 * 1000, // 1 hour
  USER_ROLE: 5 * 60 * 1000, // 5 minutes
};

/**
 * Get or compute a cached value
 */
export async function getOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttl: number = CACHE_TTL.USER_SESSION
): Promise<T> {
  try {
    // In production, this would check Redis cache
    // For now, just compute directly
    return await computeFn();
  } catch (error) {
    // Re-throw the error so callers can handle it
    // But ensure it's a proper Error object
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Cache compute failed: ${String(error)}`);
  }
}

/**
 * Delete a cache key
 */
export async function deleteCache(key: string | undefined): Promise<void> {
  if (!key) return;
  // In production, this would delete from Redis
  // For now, no-op
}

/**
 * Delete cache by pattern (for future use)
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  // In production, this would delete all keys matching pattern
  // For now, no-op
}
