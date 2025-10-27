import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/messages/channels
 * Create a new channel
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const body = await req.json();
  const { name, type, companyId } = body;

  try {
    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        companyId,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        messages: true,
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Failed to create channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    );
  }
}
