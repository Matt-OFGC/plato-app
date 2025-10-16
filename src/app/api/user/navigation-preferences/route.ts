import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Default navigation items if user hasn't customized
const DEFAULT_NAVIGATION_ITEMS = ["dashboard", "ingredients", "recipes", "recipe-mixer"];

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's navigation preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { navigationItems: true }
    });

    // Return user's custom navigation items or defaults
    const navigationItems = preferences?.navigationItems 
      ? (preferences.navigationItems as string[])
      : DEFAULT_NAVIGATION_ITEMS;

    return NextResponse.json({ navigationItems });
  } catch (error) {
    console.error("Error fetching navigation preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch navigation preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { navigationItems } = body;

    // Validate navigationItems
    if (!Array.isArray(navigationItems) || navigationItems.length !== 4) {
      return NextResponse.json(
        { error: "Navigation items must be an array of exactly 4 items" },
        { status: 400 }
      );
    }

    // Validate that all items are valid navigation options
    const validItems = [
      "dashboard", "ingredients", "recipes", "recipe-mixer", 
      "production", "wholesale", "account", "business", "team"
    ];
    
    const invalidItems = navigationItems.filter(item => !validItems.includes(item));
    if (invalidItems.length > 0) {
      return NextResponse.json(
        { error: `Invalid navigation items: ${invalidItems.join(", ")}` },
        { status: 400 }
      );
    }

    // Save navigation preferences
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: { 
        userId: user.id, 
        currency: "GBP",
        navigationItems: navigationItems
      },
      update: { navigationItems: navigationItems }
    });

    return NextResponse.json({ 
      success: true, 
      navigationItems 
    });
  } catch (error) {
    console.error("Error saving navigation preferences:", error);
    return NextResponse.json(
      { error: "Failed to save navigation preferences" },
      { status: 500 }
    );
  }
}
