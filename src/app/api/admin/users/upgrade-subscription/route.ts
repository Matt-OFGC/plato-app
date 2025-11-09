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

    // Validate tier - simplified to free/paid
    const validTiers = ["free", "paid"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'free' or 'paid'" },
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
      console.error(`[Admin Upgrade] User not found: ${userEmail}`);
      return NextResponse.json(
        { error: `User with email ${userEmail} not found` },
        { status: 404 }
      );
    }

    console.log(`[Admin Upgrade] Found user:`, {
      id: user.id,
      email: user.email,
      currentTier: user.subscriptionTier,
      currentStatus: user.subscriptionStatus,
      requestedTier: tier,
      isLifetime,
    });

    // Calculate subscription end date
    let subscriptionEndsAt: Date | null = null;
    let subscriptionTier = "starter"; // Default free tier
    let subscriptionStatus = "free";

    if (tier === "paid") {
      if (isLifetime) {
        subscriptionEndsAt = new Date("2099-12-31T23:59:59Z");
      } else {
        subscriptionEndsAt = new Date();
        subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
      }
      subscriptionTier = "paid"; // Simple paid tier
      subscriptionStatus = "active";
    } else {
      // Free tier
      subscriptionTier = "starter";
      subscriptionStatus = "free";
      subscriptionEndsAt = null;
    }

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: subscriptionTier,
        subscriptionStatus: subscriptionStatus,
        subscriptionInterval: isLifetime ? "lifetime" : "month",
        subscriptionEndsAt: subscriptionEndsAt,
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionInterval: true,
      },
    });

    console.log(`[Admin Upgrade] User updated in database:`, {
      userId: updatedUser.id,
      email: updatedUser.email,
      subscriptionTier: updatedUser.subscriptionTier,
      subscriptionStatus: updatedUser.subscriptionStatus,
      subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      subscriptionInterval: updatedUser.subscriptionInterval,
    });

    // Create or update subscription record
    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: tier === "paid" 
          ? (isLifetime ? `lifetime_${user.id}` : `admin_upgrade_${user.id}`)
          : `free_${user.id}`,
        stripePriceId: tier === "paid" ? (isLifetime ? "lifetime" : "admin_upgrade") : "free",
        stripeProductId: tier === "paid" ? (isLifetime ? "lifetime" : "admin_upgrade") : "free",
        status: subscriptionStatus,
        tier: subscriptionTier,
        price: 0,
        currency: "usd",
        interval: isLifetime ? "lifetime" : "month",
        currentPeriodStart: new Date(),
        currentPeriodEnd: subscriptionEndsAt || new Date(),
      },
      update: {
        stripeSubscriptionId: tier === "paid" 
          ? (isLifetime ? `lifetime_${user.id}` : `admin_upgrade_${user.id}`)
          : `free_${user.id}`,
        stripePriceId: tier === "paid" ? (isLifetime ? "lifetime" : "admin_upgrade") : "free",
        stripeProductId: tier === "paid" ? (isLifetime ? "lifetime" : "admin_upgrade") : "free",
        status: subscriptionStatus,
        tier: subscriptionTier,
        price: 0,
        currency: "usd",
        interval: isLifetime ? "lifetime" : "month",
        currentPeriodStart: new Date(),
        currentPeriodEnd: subscriptionEndsAt || new Date(),
      },
    });

    // Update company seat limits (unlimited for paid)
    if (user.memberships.length > 0) {
      const maxSeats = tier === "paid" ? 999999 : 1;
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

    // Verify the update actually happened by reading back from database
    const verifyUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionInterval: true,
      },
    });

    console.log(`[Admin Upgrade] Verification read from database:`, verifyUser);

    if (!verifyUser) {
      throw new Error("Failed to verify user update");
    }

    if (verifyUser.subscriptionTier !== subscriptionTier) {
      console.error(`[Admin Upgrade] MISMATCH! Expected tier ${subscriptionTier}, got ${verifyUser.subscriptionTier}`);
      throw new Error(`Database update failed: tier mismatch (expected ${subscriptionTier}, got ${verifyUser.subscriptionTier})`);
    }

    console.log(`[Admin Upgrade] Successfully updated user ${userEmail} (${user.id}) to ${tier} tier`);

    return NextResponse.json({
      success: true,
      message: `Successfully set ${userEmail} to ${tier} tier${isLifetime ? " (lifetime)" : ""}`,
      user: {
        id: verifyUser.id,
        email: verifyUser.email,
        name: user.name,
        subscriptionTier: verifyUser.subscriptionTier,
        subscriptionStatus: verifyUser.subscriptionStatus,
        subscriptionEndsAt: verifyUser.subscriptionEndsAt,
        subscriptionInterval: verifyUser.subscriptionInterval,
      },
      debug: {
        requestedTier: tier,
        requestedStatus: subscriptionStatus,
        actualTier: verifyUser.subscriptionTier,
        actualStatus: verifyUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, error });
    return NextResponse.json(
      { 
        error: "Failed to upgrade subscription",
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
