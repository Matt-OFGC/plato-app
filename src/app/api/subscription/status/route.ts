import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUserSubscription } from "@/lib/subscription";
import { hasAIAccess, getAISubscriptionType } from "@/lib/subscription-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

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
      }),
      prisma.membership.findFirst({
        where: {
          userId: session.id,
          isActive: true,
        },
        include: {
          company: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscription and AI access in parallel
    const [subscriptionResult, aiAccessResult] = await Promise.allSettled([
      getUserSubscription(user.id),
      membership?.company ? (async () => {
        const companyId = membership.company.id;
        const hasAI = await hasAIAccess(companyId);
        if (hasAI) {
          const aiType = await getAISubscriptionType(companyId);
          return {
            active: true,
            type: aiType,
          };
        }
        return null;
      })() : Promise.resolve(null),
    ]);
    
    // Get subscription data
    const subscription = subscriptionResult.status === 'fulfilled' ? subscriptionResult.value : null;
    
    // Get AI subscription info if available
    let aiSubscription = null;
    if (aiAccessResult.status === 'fulfilled') {
      aiSubscription = aiAccessResult.value;
    } else {
      // Log error but don't fail the request
      logger.warn("Error getting AI subscription", aiAccessResult.reason, "Subscription/Status");
    }

    return createOptimizedResponse({
      subscription: subscriptionData,
      aiSubscription,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
      },
    }, {
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
