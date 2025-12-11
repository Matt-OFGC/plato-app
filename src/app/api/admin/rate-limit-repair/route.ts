import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { logger } from "@/lib/logger";
import { getRepairRateLimitStatus } from "@/lib/rate-limit-repair";

/**
 * Admin endpoint to check rate limit status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter required" },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId, 10);
    const status = getRepairRateLimitStatus(userIdNum);

    return NextResponse.json({
      userId: userIdNum,
      ...status,
    });
  } catch (error) {
    logger.error('Error checking repair rate limit', error, 'Admin');
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
