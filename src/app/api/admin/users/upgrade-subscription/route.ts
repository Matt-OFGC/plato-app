import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userEmail, tier, isLifetime = false } = body;

    if (!userEmail || !tier) {
      return NextResponse.json(
        { error: "userEmail and tier are required" },
        { status: 400 }
      );
    }

    // Validate tier
    const validTiers = ["starter", "professional", "team", "business"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be one of: starter, professional, team, business" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        subscription: true,
        memberships: {
          where: { role: "OWNER" },
          include: { company: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User with email ${userEmail} not found` },
        { status: 404 }
      );
    }

    // Calculate subscription end date
    let subscriptionEndsAt: Date;
    if (isLifetime) {
      // Set to year 2099 for lifetime access
      subscriptionEndsAt = new Date("2099-12-31T23:59:59Z");
    } else {
      // Default to 1 year from now
      subscriptionEndsAt = new Date();
      subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
    }

    // Determine max seats based on tier
    let maxSeats = 1;
    if (tier === "team") {
      maxSeats = 5;
    } else if (tier === "business") {
      maxSeats = 999999; // Effectively unlimited
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: "active",
        subscriptionInterval: isLifetime ? "lifetime" : "year",
        subscriptionEndsAt: subscriptionEndsAt,
      },
    });

    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: isLifetime ? `lifetime_${user.id}` : `admin_upgrade_${user.id}`,
        stripePriceId: isLifetime ? "lifetime" : "admin_upgrade",
        stripeProductId: isLifetime ? "lifetime" : "admin_upgrade",
        status: "active",
        tier: tier,
        price: 0, // Free admin upgrade
        currency: "usd",
        interval: isLifetime ? "lifetime" : "year",
        currentPeriodStart: new Date(),
        currentPeriodEnd: subscriptionEndsAt,
        maxIngredients: null, // All paid tiers have unlimited
        maxRecipes: null, // All paid tiers have unlimited
      },
      update: {
        stripeSubscriptionId: isLifetime ? `lifetime_${user.id}` : `admin_upgrade_${user.id}`,
        stripePriceId: isLifetime ? "lifetime" : "admin_upgrade",
        stripeProductId: isLifetime ? "lifetime" : "admin_upgrade",
        status: "active",
        tier: tier,
        price: 0,
        currency: "usd",
        interval: isLifetime ? "lifetime" : "year",
        currentPeriodStart: new Date(),
        currentPeriodEnd: subscriptionEndsAt,
        maxIngredients: null,
        maxRecipes: null,
      },
    });

    // Update company seat limits if user is company owner
    if (user.memberships.length > 0) {
      for (const membership of user.memberships) {
        if (membership.company) {
          await prisma.company.update({
            where: { id: membership.company.id },
            data: {
              maxSeats: maxSeats,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded ${userEmail} to ${tier} tier${isLifetime ? " (lifetime)" : ""}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionTier: tier,
        subscriptionStatus: "active",
        subscriptionEndsAt: subscriptionEndsAt,
      },
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade subscription" },
      { status: 500 }
    );
  }
}
