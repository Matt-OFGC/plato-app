import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notification = await prisma.notification.update({
      where: {
        id: parseInt(id),
        userId: session.id, // Ensure user owns this notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.notification.delete({
      where: {
        id: parseInt(id),
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

