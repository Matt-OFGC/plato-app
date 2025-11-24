import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getUserSubscription } from "@/lib/subscription";
import { hasAIAccess, getAISubscriptionType } from "@/lib/subscription-simple";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscription = await getUserSubscription(user.id);
    
    // Get AI subscription info if user has a company
    let aiSubscription = null;
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
        include: {
          company: true,
        },
      });

      if (membership?.company) {
        const companyId = membership.company.id;
        const hasAI = await hasAIAccess(companyId);
        if (hasAI) {
          const aiType = await getAISubscriptionType(companyId);
          aiSubscription = {
            active: true,
            type: aiType,
          };
        }
      }
    } catch (error) {
      // Ignore errors getting AI subscription
      console.error("Error getting AI subscription:", error);
    }
    
    return NextResponse.json({
      subscription,
      aiSubscription,
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
      },
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
