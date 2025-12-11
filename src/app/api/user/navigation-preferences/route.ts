import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const { user } = await getCurrentUserAndCompany();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's navigation preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { navigationItems: true }
    });

    return NextResponse.json({
      navigationItems: preferences?.navigationItems || null,
      success: true
    });
  } catch (error) {
    logger.error("Error fetching navigation preferences", error, "User/NavigationPreferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUserAndCompany();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { navigationItems } = await request.json();

    if (!navigationItems || !Array.isArray(navigationItems)) {
      return NextResponse.json({ error: "Invalid navigation items" }, { status: 400 });
    }

    // Update or create user preferences
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        navigationItems: navigationItems,
        currency: "GBP" // Default currency
      },
      update: {
        navigationItems: navigationItems
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error saving navigation preferences", error, "User/NavigationPreferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}