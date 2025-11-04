import { NextResponse } from 'next/server';

/**
 * Cache control headers for different types of API responses
 */

export const CacheHeaders = {
  /**
   * Static data that rarely changes (categories, suppliers)
   * Cache for 1 hour
   */
  static: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  
  /**
   * Frequently accessed data (ingredients, recipes)
   * Cache for 5 minutes
   */
  frequent: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
  },
  
  /**
   * Data that changes often (inventory, production plans)
   * Cache for 1 minute
   */
  dynamic: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
  
  /**
   * Real-time data that must be fresh
   * No caching
   */
  noCache: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  },
  
  /**
   * User-specific data with revalidation
   * Cache per-user for 30 seconds
   */
  user: {
    'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
  },
};

/**
 * Helper to add cache headers to a NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  headers: Partial<typeof CacheHeaders.static>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a cached response with ETag for conditional requests
 */
export function createCachedResponse(
  data: any,
  cacheType: keyof typeof CacheHeaders,
  etag?: string
): NextResponse {
  const headers = CacheHeaders[cacheType];
  const response = NextResponse.json(data);
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  if (etag) {
    response.headers.set('ETag', etag);
  }
  
  return response;
}

/**
 * Check if request has matching ETag (for conditional requests)
 */
export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}

/**
 * Create a 304 Not Modified response
 */
export function notModified(): NextResponse {
  return new NextResponse(null, { status: 304 });
}
