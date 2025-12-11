import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUserAndCompany();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currency, targetFoodCost, maxFoodCost } = body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (currency !== undefined) updateData.currency = currency;
    if (targetFoodCost !== undefined) updateData.targetFoodCost = targetFoodCost;
    if (maxFoodCost !== undefined) updateData.maxFoodCost = maxFoodCost;

    // Update or create user preferences
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        currency: currency || "GBP",
        targetFoodCost: targetFoodCost || 25.0,
        maxFoodCost: maxFoodCost || 35.0,
      },
      update: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error saving user preferences", error, "User/Preferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
