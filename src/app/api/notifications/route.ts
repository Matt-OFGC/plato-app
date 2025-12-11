import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.id,
        ...(unreadOnly && { read: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error("Get notifications error", error, "Notifications");
    return NextResponse.json(
      { error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// Create notification
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, link, metadata } = body;

    const notification = await prisma.notification.create({
      data: {
        userId: userId || session.id,
        type,
        title,
        message,
        link,
        metadata,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    logger.error("Create notification error", error, "Notifications");
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Mark all read error", error, "Notifications");
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    );
  }
}

