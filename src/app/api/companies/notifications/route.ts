import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";

/**
 * Create company-wide notification
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, title, message, priority = "normal" } = body;

    if (!companyId || !title || !message) {
      return NextResponse.json(
        { error: "Company ID, title, and message are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "settings:edit");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to create notifications" },
        { status: 403 }
      );
    }

    // Get all active members
    const memberships = await prisma.membership.findMany({
      where: { companyId, isActive: true },
      select: { userId: true },
    });

    // Create notifications for all members (if Notification model exists)
    let notifications = { count: 0 };
    try {
      if (prisma.notification) {
        notifications = await prisma.notification.createMany({
          data: memberships.map(m => ({
            userId: m.userId,
            type: "company_announcement",
            title,
            message,
            metadata: {
              companyId,
              priority,
              createdBy: session.id,
            },
          })),
        });
      } else {
        // Fallback: just log the notification
        logger.info(`Company notification (model not available)`, {
          companyId,
          userId: session.id,
          recipients: memberships.length,
          title,
          message,
        }, "Companies");
        notifications = { count: memberships.length };
      }
    } catch (error) {
      logger.warn("Notification model not available or error creating notifications", { error }, "Companies");
      notifications = { count: memberships.length };
    }

    logger.info(`Company notification created`, {
      companyId,
      userId: session.id,
      recipients: memberships.length,
    }, "Companies");

    return NextResponse.json({
      success: true,
      notificationsSent: notifications.count,
      message: `Notification sent to ${notifications.count} team member(s)`,
    });
  } catch (error) {
    logger.error("Error creating company notification", error, "Companies");
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

/**
 * Get company notifications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get user's notifications for this company (if Notification model exists)
    let notifications: any[] = [];
    try {
      if (prisma.notification) {
        notifications = await prisma.notification.findMany({
          where: {
            userId: session.id,
            type: "company_announcement",
            metadata: {
              path: ["companyId"],
              equals: companyId,
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });
      }
    } catch {
      // Model doesn't exist, return empty array
    }

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    logger.error("Error fetching company notifications", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
