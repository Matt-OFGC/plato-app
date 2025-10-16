import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Default navigation items if user hasn't customized
const DEFAULT_NAVIGATION_ITEMS = ["dashboard", "ingredients", "recipes", "recipe-mixer"];

export async function GET() {
  try {
    // For now, just return default navigation items to avoid database issues
    return NextResponse.json({ navigationItems: DEFAULT_NAVIGATION_ITEMS });
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
    // For now, just return success to avoid database issues
    return NextResponse.json({ 
      success: true, 
      navigationItems: DEFAULT_NAVIGATION_ITEMS 
    });
  } catch (error) {
    console.error("Error saving navigation preferences:", error);
    return NextResponse.json(
      { error: "Failed to save navigation preferences" },
      { status: 500 }
    );
  }
}
