import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

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
    const planId = parseInt(id);
    const body = await request.json();
    const { name, startDate, endDate, items, notes } = body;

    if (!name || !startDate || !endDate || !items) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the plan exists and belongs to the user's company
    const existingPlan = await prisma.productionPlan.findUnique({
      where: { id: planId },
      include: { company: true },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Delete existing items and create new ones
    await prisma.productionItem.deleteMany({
      where: { planId },
    });

    // Update the plan with new items
    const updatedPlan = await prisma.productionPlan.update({
      where: { id: planId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes,
        items: {
          create: items.map((item: any, index: number) => ({
            recipeId: item.recipeId,
            quantity: item.quantity,
            priority: index,
          })),
        },
      },
      include: {
        items: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                yieldQuantity: true,
                yieldUnit: true,
              },
            },
          },
        },
        tasks: true,
      },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error("Update production plan error:", error);
    return NextResponse.json(
      { error: "Failed to update production plan" },
      { status: 500 }
    );
  }
}

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
    const planId = parseInt(id);

    // Verify the plan exists
    const existingPlan = await prisma.productionPlan.findUnique({
      where: { id: planId },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Delete the plan (cascade will delete items and tasks)
    await prisma.productionPlan.delete({
      where: { id: planId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete production plan error:", error);
    return NextResponse.json(
      { error: "Failed to delete production plan" },
      { status: 500 }
    );
  }
}

