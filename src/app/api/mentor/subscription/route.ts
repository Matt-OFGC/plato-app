import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { hasAIAccess, getAISubscriptionType } from "@/lib/subscription-simple";
import { logger } from "@/lib/logger";

/**
 * Get Mentor subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's company
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.id,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    if (!membership || !membership.company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyId = membership.company.id;

    // Hide Mentor in MVP mode
    const isMVP = process.env.MVP_MODE === "true" || process.env.NEXT_PUBLIC_MVP_MODE === "true";
    if (isMVP) {
      return NextResponse.json({
        hasAccess: false,
        subscription: null,
        isDevMode: false,
        isMVP: true,
      });
    }

    // Check subscription using new simplified system
    const hasAccess = await hasAIAccess(companyId);
    const subscriptionType = await getAISubscriptionType(companyId);
    
    // Get full subscription details for response
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        companyId,
        status: "active",
      },
    });
    
    // In dev mode, allow access even without subscription (for testing)
    const isDev = process.env.NODE_ENV !== "production";
    const effectiveHasAccess = hasAccess || isDev;

    return NextResponse.json({
      hasAccess: effectiveHasAccess,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            subscriptionType: subscription.subscriptionType || subscriptionType,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      isDevMode: isDev,
    });
  } catch (error) {
    logger.error("Failed to fetch subscription status", error, "Mentor/Subscription");
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}

