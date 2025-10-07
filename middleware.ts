import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ["/login", "/register", "/api/auth", "/", "/favicon.ico", "/pricing"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  
  // For now, let all requests through - authentication will be handled at the page level
  // This avoids the Prisma edge runtime issue
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};


