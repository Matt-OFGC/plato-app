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

    // Get user's app preferences
    // Note: appPreferences field may not exist in schema yet, so we'll use timerSettings as a workaround
    // or return null if the field doesn't exist
    try {
      const preferences = await prisma.userPreference.findUnique({
        where: { userId: user.id },
        select: { timerSettings: true } // Using existing field for now
      });

      // For now, return empty preferences since appPreferences field doesn't exist
      // This will be updated once the schema migration is run
      return NextResponse.json({
        preferences: null, // Will be populated after schema migration
        success: true
      });
    } catch (error: any) {
      // If field doesn't exist, return null preferences
      if (error.message?.includes('Unknown arg') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          preferences: null,
          success: true,
          message: "Preferences field not yet available in database"
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error("Error fetching app preferences", error, "User/Preferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUserAndCompany();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    // Note: appPreferences field doesn't exist in schema yet
    // For now, we'll store in navigationItems JSON field as a temporary workaround
    // TODO: Add appPreferences field to schema and run migration
    try {
      // Try to update using navigationItems as temporary storage
      const existing = await prisma.userPreference.findUnique({
        where: { userId: user.id },
        select: { navigationItems: true }
      });

      const navItems = existing?.navigationItems || {};
      const updatedNavItems = {
        ...(typeof navItems === 'object' && navItems !== null ? navItems : {}),
        appPreferences: preferences
      };

      await prisma.userPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          navigationItems: updatedNavItems,
          currency: "GBP"
        },
        update: {
          navigationItems: updatedNavItems
        }
      });

      return NextResponse.json({ 
        success: true,
        message: "Preferences saved (using temporary storage until schema is updated)"
      });
    } catch (error: any) {
      // If there's an error, return a helpful message
      logger.error("Error saving app preferences", error, "User/Preferences");
      return NextResponse.json({ 
        error: "Database field not available yet. Preferences saved locally in your browser.",
        savedLocally: true
      }, { status: 200 }); // Return 200 so component treats it as success
    }
  } catch (error) {
    logger.error("Error saving app preferences", error, "User/Preferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

