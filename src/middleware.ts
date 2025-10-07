import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Protect API routes
  if (nextUrl.pathname.startsWith("/api/")) {
    // Allow auth routes
    if (nextUrl.pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }
    
    // For other API routes, check if user is logged in
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect dashboard routes
  if (nextUrl.pathname.startsWith("/recipes") || 
      nextUrl.pathname.startsWith("/ingredients") ||
      nextUrl.pathname.startsWith("/account")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
