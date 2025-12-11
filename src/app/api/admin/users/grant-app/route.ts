import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { App } from "@/lib/apps/types";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, app } = body;

    if (!userId || !app) {
      return NextResponse.json({ error: "userId and app are required" }, { status: 400 });
    }

    if (app !== "plato" && app !== "plato_bake") {
      return NextResponse.json({ error: "Invalid app. Must be 'plato' or 'plato_bake'" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Grant app access (create or update subscription)
    try {
      const subscription = await prisma.userAppSubscription.upsert({
        where: {
          userId_app: {
            userId: user.id,
            app: app as App,
          },
        },
        update: {
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          app: app as App,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          cancelAtPeriodEnd: false,
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Granted ${app} access to ${user.email}`,
        subscription 
      });
    } catch (error: any) {
      // If table doesn't exist, use raw SQL
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "UserAppSubscription" ("userId", "app", "status", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt", "updatedAt")
          VALUES (${user.id}, '${app}', 'active', NOW(), NOW() + INTERVAL '1 year', false, NOW(), NOW())
          ON CONFLICT ("userId", "app") 
          DO UPDATE SET 
            "status" = 'active',
            "currentPeriodStart" = NOW(),
            "currentPeriodEnd" = NOW() + INTERVAL '1 year',
            "cancelAtPeriodEnd" = false,
            "updatedAt" = NOW()
        `);

        return NextResponse.json({ 
          success: true, 
          message: `Granted ${app} access to ${user.email} (via raw SQL)` 
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error("Admin grant app API error", error, "Admin/Users");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to grant app access", details: errorMessage },
      { status: 500 }
    );
  }
}

