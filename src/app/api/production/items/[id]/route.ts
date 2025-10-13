import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { completed, quantity, notes } = body;

    const item = await prisma.productionItem.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(completed !== undefined && { completed }),
        ...(quantity !== undefined && { quantity }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Update production item error:", error);
    return NextResponse.json(
      { error: "Failed to update production item" },
      { status: 500 }
    );
  }
}

