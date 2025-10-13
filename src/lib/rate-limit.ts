/**
 * Rate Limiting Utility
 * Prevents abuse of API endpoints by limiting requests per IP/user
 */

import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// In-memory store (use Redis in production for distributed systems)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetAt < now) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * @returns null if allowed, or { error, retryAfter } if rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  // No record or window expired - create new one
  if (!record || record.resetAt < now) {
    requestCounts.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { allowed: true };
  }

  // Within window - check count
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  return { allowed: true };
}

/**
 * Get client identifier (IP address)
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for reverse proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }

  // Fallback: use a combination of headers for fingerprinting
  // Note: NextRequest doesn't expose IP directly, so we use headers
  return "unknown";
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Strict limits for auth endpoints
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  REGISTER: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 accounts per hour
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 resets per hour
  
  // Moderate limits for data operations
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute
  CREATE: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 creates per minute
  
  // Generous limits for read operations
  API: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
} as const;

/**
 * Helper to apply rate limiting in API routes
 */
export function rateLimit(request: NextRequest, config: RateLimitConfig) {
  const identifier = getClientIdentifier(request);
  return checkRateLimit(identifier, config);
}

