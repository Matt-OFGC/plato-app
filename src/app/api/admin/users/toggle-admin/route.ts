import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, isAdmin } = body;

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toggle admin status error:", error);
    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }
}

