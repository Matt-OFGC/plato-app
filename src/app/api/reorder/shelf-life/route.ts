import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Update order for each shelf life option
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.shelfLifeOption.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder shelf life options error:", error);
    return NextResponse.json(
      { error: "Failed to reorder shelf life options" },
      { status: 500 }
    );
  }
}

