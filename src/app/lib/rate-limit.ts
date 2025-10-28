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
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Get client identifier
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return ip;
}

// Rate limiting function
export function rateLimit(request: NextRequest, config: RateLimitConfig): RateLimitResult {
  const clientId = getClientId(request);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Clean up expired entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create client record
  let clientRecord = rateLimitStore.get(clientId);
  
  if (!clientRecord || clientRecord.resetTime < now) {
    // New window or expired
    clientRecord = {
      count: 1,
      resetTime: now + config.windowMs
    };
    rateLimitStore.set(clientId, clientRecord);
    
    return {
      allowed: true,
      retryAfter: 0,
      remaining: config.maxRequests - 1
    };
  }
  
  // Check if limit exceeded
  if (clientRecord.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000),
      remaining: 0
    };
  }
  
  // Increment counter
  clientRecord.count++;
  rateLimitStore.set(clientId, clientRecord);
  
  return {
    allowed: true,
    retryAfter: 0,
    remaining: config.maxRequests - clientRecord.count
  };
}

// Middleware helper for rate limiting
export function withRateLimit(config: RateLimitConfig) {
  return function(request: NextRequest) {
    return rateLimit(request, config);
  };
}
