import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.id,
        revokedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    // Parse user agent for each session
    const sessionsWithDetails = sessions.map((s) => {
      const ua = (s.userAgent || "").toLowerCase();

      // Browser detection
      let browser = "Unknown Browser";
      if (ua.includes("edg/")) browser = "Edge";
      else if (ua.includes("chrome/")) browser = "Chrome";
      else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";
      else if (ua.includes("firefox/")) browser = "Firefox";
      else if (ua.includes("opera/") || ua.includes("opr/")) browser = "Opera";

      // OS detection
      let os = "Unknown OS";
      if (ua.includes("windows")) os = "Windows";
      else if (ua.includes("mac os x")) os = "macOS";
      else if (ua.includes("linux")) os = "Linux";
      else if (ua.includes("android")) os = "Android";
      else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

      // Device type
      let device = "Desktop";
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
        device = "Mobile";
      } else if (ua.includes("tablet") || ua.includes("ipad")) {
        device = "Tablet";
      }

      return {
        id: s.id,
        browser,
        os,
        device,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
      };
    });

    return NextResponse.json({ sessions: sessionsWithDetails });
  } catch (error) {
    logger.error("Failed to fetch sessions", error, "Sessions");
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const logoutAll = searchParams.get("all") === "true";

    if (logoutAll) {
      // Get current session token from cookie
      const currentToken = request.cookies.get("session")?.value;

      // Revoke all OTHER sessions (not the current one)
      const result = await prisma.session.updateMany({
        where: {
          userId: session.id,
          revokedAt: null,
          ...(currentToken ? { token: { not: currentToken } } : {}),
        },
        data: {
          revokedAt: new Date(),
        },
      });

      logger.info(`User ${session.id} revoked ${result.count} sessions`, {}, "Sessions");

      return NextResponse.json({
        success: true,
        message: `Logged out ${result.count} other device(s)`,
        count: result.count,
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const sessionToRevoke = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!sessionToRevoke || sessionToRevoke.userId !== session.id) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Revoke the session
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    logger.info(`User ${session.id} revoked session ${sessionId}`, {}, "Sessions");

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    logger.error("Failed to revoke session", error, "Sessions");
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
