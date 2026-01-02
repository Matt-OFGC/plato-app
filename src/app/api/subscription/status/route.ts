import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";
import { buildSubscriptionStatusPayload } from "@/lib/subscription-status";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // OPTIMIZATION: Run user and membership queries in parallel
    const [user, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          subscriptionInterval: true,
        },
      }),
      prisma.membership.findFirst({
        where: {
          userId: session.id,
          isActive: true,
        },
        select: {
          companyId: true,
          company: {
            select: { id: true },
          },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const payload = await buildSubscriptionStatusPayload(user.id, membership?.companyId ?? membership?.company?.id ?? null);

    return createOptimizedResponse(payload, {
      cacheType: 'user', // User-specific data
      compression: true,
    });
  } catch (error) {
    logger.error("Status error", error, "Subscription/Status");
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
