/**
 * Next.js Middleware
 * Add security headers and CSRF protection
 */

import { NextRequest, NextResponse } from "next/server";

// CSRF token cookie name
const CSRF_TOKEN_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

/**
 * Generate a random CSRF token
 */
function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  
  // Add Strict-Transport-Security in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://api.stripe.com https://*.vercel-storage.com;
    frame-src 'self' https://js.stripe.com;
    form-action 'self';
    base-uri 'self';
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set("Content-Security-Policy", cspHeader);

  // CSRF Protection for state-changing methods
  const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(request.method);
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");
  
  if (isStateChanging && isApiRoute) {
    // Exclude certain routes from CSRF check (webhook endpoints, etc.)
    const csrfExemptRoutes = [
      "/api/webhooks/",
      "/api/auth/",
      "/api/login",
      "/api/register",
    ];
    
    const isExempt = csrfExemptRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    if (!isExempt) {
      const csrfTokenFromCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
      const csrfTokenFromHeader = request.headers.get(CSRF_HEADER);

      // Verify CSRF token
      if (!csrfTokenFromCookie || csrfTokenFromCookie !== csrfTokenFromHeader) {
        // For now, just log the CSRF mismatch (to avoid breaking existing flows)
        // In production, you would want to return 403
        console.warn("CSRF token mismatch:", {
          path: request.nextUrl.pathname,
          hasCookie: !!csrfTokenFromCookie,
          hasHeader: !!csrfTokenFromHeader,
        });
        
        // Uncomment to enforce CSRF protection:
        // return NextResponse.json(
        //   { error: "Invalid CSRF token" },
        //   { status: 403 }
        // );
      }
    }
  }

  // Set CSRF token cookie if it doesn't exist
  if (!request.cookies.get(CSRF_TOKEN_COOKIE)) {
    const token = generateCsrfToken();
    response.cookies.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  return response;
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
