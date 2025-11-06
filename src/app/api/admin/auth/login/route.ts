import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for admin login
    const rateLimitResult = rateLimit(request, RATE_LIMITS.LOGIN);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` },
        { 
          status: 429,
          headers: { "Retry-After": String(rateLimitResult.retryAfter) }
        }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Verify admin credentials (now returns AdminSession or null)
    const adminSession = await verifyAdminCredentials(username, password);

    if (!adminSession) {
      // Log failed attempt
      logger.warn("Failed admin login attempt:", { username, timestamp: new Date(), ip: request.headers.get('x-forwarded-for') });
      
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create secure admin session with request info for device tracking
    await createAdminSession(adminSession, { headers: request.headers });

    logger.info("Successful admin login:", { 
      username: adminSession.username, 
      userId: adminSession.userId,
      timestamp: new Date() 
    });

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
    });
  } catch (error) {
    logger.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

