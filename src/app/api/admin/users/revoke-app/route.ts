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

    // Revoke app access (set status to canceled)
    try {
      const subscription = await prisma.userAppSubscription.update({
        where: {
          userId_app: {
            userId: user.id,
            app: app as App,
          },
        },
        data: {
          status: "canceled",
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ 
        success: true, 
        message: `Revoked ${app} access from ${user.email}`,
        subscription 
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Subscription doesn't exist
        return NextResponse.json({ 
          error: "User doesn't have this app subscription" 
        }, { status: 404 });
      }
      throw error;
    }
  } catch (error) {
    logger.error("Admin revoke app API error", error, "Admin/Users");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to revoke app access", details: errorMessage },
      { status: 500 }
    );
  }
}

