/**
 * Redis caching utility
 * 
 * Provides a caching layer for frequently accessed data:
 * - User sessions and company metadata
 * - Frequently accessed lookups (ingredients, categories, etc.)
 * - API response caching
 * 
 * Falls back gracefully if Redis is not configured
 */

import { logger } from "./logger";

// Redis client (lazy-loaded)
let redisClient: any = null;
let redisEnabled = false;

// Initialize Redis client
async function initRedis() {
  // If already initialized (even if failed), return the client or null
  if (redisClient !== null || redisEnabled === false) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.debug("Redis not configured, caching disabled", undefined, "Redis");
    redisEnabled = false;
    redisClient = null; // Mark as attempted
    return null;
  }

  try {
    // Try to import redis client
    const redis = await import("ioredis");
    redisClient = new redis.Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000, // 5 second timeout
      commandTimeout: 5000, // 5 second command timeout
    });

    redisClient.on("error", (error: Error) => {
      logger.warn("Redis connection error", error, "Redis");
      redisEnabled = false;
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected", undefined, "Redis");
      redisEnabled = true;
    });

    // Try to connect with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Redis connection timeout")), 5000)
      )
    ]);
    
    redisEnabled = true;
    return redisClient;
  } catch (error) {
    logger.warn("Redis initialization failed, caching disabled", error, "Redis");
    redisEnabled = false;
    redisClient = null; // Mark as attempted
    return null;
  }
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  USER_SESSION: 15 * 60, // 15 minutes
  COMPANY_INFO: 10 * 60, // 10 minutes
  USER_COMPANIES: 5 * 60, // 5 minutes
  INGREDIENTS: 5 * 60, // 5 minutes
  RECIPES: 10 * 60, // 10 minutes
  CATEGORIES: 60 * 60, // 1 hour
  SUPPLIERS: 30 * 60, // 30 minutes
  STATIC_DATA: 24 * 60 * 60, // 24 hours
};

// Cache key generators
export const CacheKeys = {
  userSession: (userId: number) => `user:session:${userId}`,
  companyInfo: (companyId: number) => `company:info:${companyId}`,
  userCompanies: (userId: number) => `user:${userId}:companies`,
  ingredients: (companyId: number) => `company:${companyId}:ingredients`,
  recipes: (companyId: number) => `company:${companyId}:recipes`,
  categories: (companyId: number) => `company:${companyId}:categories`,
  suppliers: (companyId: number) => `company:${companyId}:suppliers`,
  apiResponse: (key: string) => `api:response:${key}`,
};

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await initRedis();
    if (!client || !redisEnabled) {
      return null;
    }

    // Add timeout to prevent hanging
    const value = await Promise.race([
      client.get(key),
      new Promise<string | null>((_, reject) => 
        setTimeout(() => reject(new Error("Redis get timeout")), 2000)
      )
    ]) as string | null;
    
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    // Silently fail - don't log warnings for expected failures
    return null;
  }
}

/**
 * Set value in cache
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number = CACHE_TTL.STATIC_DATA
): Promise<boolean> {
  try {
    const client = await initRedis();
    if (!client || !redisEnabled) {
      return false;
    }

    // Add timeout to prevent hanging
    await Promise.race([
      client.setex(key, ttl, JSON.stringify(value)),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Redis set timeout")), 2000)
      )
    ]);
    
    return true;
  } catch (error) {
    // Silently fail - don't log warnings for expected failures
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    const client = await initRedis();
    if (!client || !redisEnabled) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    logger.warn("Cache delete failed", error, "Redis");
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const client = await initRedis();
    if (!client || !redisEnabled) {
      return 0;
    }

    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await client.del(...keys);
    return keys.length;
  } catch (error) {
    logger.warn("Cache pattern delete failed", error, "Redis");
    return 0;
  }
}

/**
 * Invalidate cache for a company (useful when company data changes)
 */
export async function invalidateCompanyCache(companyId: number): Promise<void> {
  const patterns = [
    CacheKeys.companyInfo(companyId),
    CacheKeys.ingredients(companyId),
    CacheKeys.recipes(companyId),
    CacheKeys.categories(companyId),
    CacheKeys.suppliers(companyId),
  ];

  await Promise.all(patterns.map(key => deleteCache(key)));
  
  // Also invalidate user companies cache for all users (pattern match)
  await deleteCachePattern(`user:*:companies`);
}

/**
 * Cache helper: Get or compute
 * 
 * Usage:
 * const data = await getOrCompute(
 *   CacheKeys.ingredients(companyId),
 *   () => fetchIngredientsFromDB(companyId),
 *   CACHE_TTL.INGREDIENTS
 * );
 */
export async function getOrCompute<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttl: number = CACHE_TTL.STATIC_DATA
): Promise<T> {
  // Try cache first
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute and cache
  const value = await computeFn();
  await setCache(key, value, ttl);
  return value;
}

/**
 * Check if Redis is enabled
 */
export function isRedisEnabled(): boolean {
  return redisEnabled;
}

/**
 * Close Redis connection (for cleanup)
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      redisEnabled = false;
    } catch (error) {
      logger.warn("Redis close failed", error, "Redis");
    }
  }
}

