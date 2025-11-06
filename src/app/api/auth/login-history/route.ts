import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Get user's login history from sessions
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent sessions (login history)
    const sessions = await prisma.session.findMany({
      where: {
        userId: session.id,
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Last 50 logins
    });

    // Format sessions for display
    const loginHistory = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress || 'Unknown',
      userAgent: s.userAgent || 'Unknown',
      location: 'Unknown', // Could use IP geolocation service
      device: parseUserAgent(s.userAgent || ''),
      loginTime: s.createdAt,
      lastActivity: s.lastUsedAt,
      isActive: !s.revokedAt && s.expiresAt > new Date(),
      isCurrent: false, // Would need to compare with current session token
    }));

    return NextResponse.json({ loginHistory });
  } catch (error) {
    console.error("Get login history error:", error);
    return NextResponse.json(
      { error: "Failed to get login history" },
      { status: 500 }
    );
  }
}

// Parse user agent to get device info
function parseUserAgent(userAgent: string): string {
  if (!userAgent) return 'Unknown Device';
  
  // Simple parsing - in production, use a library like 'ua-parser-js'
  if (userAgent.includes('Mobile')) {
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android Device';
    return 'Mobile Device';
  }
  
  if (userAgent.includes('Mac')) return 'Mac';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Linux')) return 'Linux';
  
  return 'Desktop';
}

