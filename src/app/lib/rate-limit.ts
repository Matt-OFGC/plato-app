import { NextRequest } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3
  }
} as const;

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number; attempts: number }>();

// Get client identifier
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

// Get email identifier for per-email rate limiting
function getEmailId(email?: string): string | null {
  if (!email) return null;
  return `email:${email.toLowerCase().trim()}`;
}

// Rate limiting function with support for per-email limiting
export function rateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  options?: { email?: string; perEmail?: boolean }
): RateLimitResult {
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up (avoids doing it every time)
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  // Check per-email rate limiting if email is provided
  if (options?.perEmail && options.email) {
    const emailId = getEmailId(options.email);
    if (emailId) {
      const emailResult = checkRateLimit(emailId, config, now);
      if (!emailResult.allowed) {
        return emailResult;
      }
    }
  }
  
  // Check IP-based rate limiting
  const clientId = getClientId(request);
  return checkRateLimit(clientId, config, now);
}

// Internal function to check rate limit for a given identifier
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  let record = rateLimitStore.get(identifier);
  
  if (!record || record.resetTime < now) {
    // New window or expired
    record = {
      count: 1,
      resetTime: now + config.windowMs,
      attempts: 1,
    };
    rateLimitStore.set(identifier, record);
    
    return {
      allowed: true,
      retryAfter: 0,
      remaining: config.maxRequests - 1,
    };
  }
  
  // Increment attempt counter for progressive delays
  record.attempts++;
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    // Progressive delay: increase retry time based on attempts
    const baseRetryAfter = Math.ceil((record.resetTime - now) / 1000);
    const progressiveDelay = Math.min(record.attempts * 60, 3600); // Max 1 hour delay
    
    return {
      allowed: false,
      retryAfter: baseRetryAfter + progressiveDelay,
      remaining: 0,
    };
  }
  
  // Increment counter
  record.count++;
  rateLimitStore.set(identifier, record);
  
  return {
    allowed: true,
    retryAfter: 0,
    remaining: config.maxRequests - record.count,
  };
}

// Middleware helper for rate limiting
export function withRateLimit(config: RateLimitConfig) {
  return function(request: NextRequest) {
    return rateLimit(request, config);
  };
}
