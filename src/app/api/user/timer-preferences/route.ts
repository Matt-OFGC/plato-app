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

    // Get user's timer preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: user.id },
      select: { timerSettings: true }
    });

    return NextResponse.json({
      settings: preferences?.timerSettings || {
        soundEnabled: true,
        notificationEnabled: true,
        soundVolume: 50,
        notificationDuration: 5,
      },
      success: true
    });
  } catch (error) {
    logger.error("Error fetching timer preferences", error, "User/TimerPreferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getCurrentUserAndCompany();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: "Invalid timer settings" }, { status: 400 });
    }

    // Update or create user preferences
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        timerSettings: settings,
        currency: "GBP" // Default currency
      },
      update: {
        timerSettings: settings
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error saving timer preferences", error, "User/TimerPreferences");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
