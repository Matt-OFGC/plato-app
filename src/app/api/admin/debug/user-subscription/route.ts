import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { isPaidTier, getUnlockStatus } from "@/lib/features";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json({ error: "email parameter required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        subscriptionInterval: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check what isPaidTier returns
    const paid = await isPaidTier(user.id);
    const unlockStatus = await getUnlockStatus(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndsAt: user.subscriptionEndsAt,
        subscriptionInterval: user.subscriptionInterval,
      },
      isPaidTier: paid,
      unlockStatus,
      debug: {
        subscriptionTierLowercase: user.subscriptionTier?.toLowerCase(),
        paidTiers: ["professional", "team", "business"],
        isInPaidTiers: ["professional", "team", "business"].includes(user.subscriptionTier?.toLowerCase() || ""),
        subscriptionEndsAtDate: user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null,
        now: new Date(),
        endsAtGreaterThanNow: user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) > new Date() : null,
      },
    });
  } catch (error) {
    console.error("Debug subscription error:", error);
    return NextResponse.json(
      { error: "Failed to debug subscription", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}





