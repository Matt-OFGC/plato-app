import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/current";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/messages/channels/:channelId/messages
 * Get all messages in a channel
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channelId = parseInt(params.channelId);

  try {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        reactions: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100, // Last 100 messages
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Failed to load messages:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/channels/:channelId/messages
 * Send a message to a channel
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const channelId = parseInt(params.channelId);
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  try {
    // Verify user is a member of the channel
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this channel" },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        channelId,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update channel's updatedAt timestamp
    await prisma.channel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
