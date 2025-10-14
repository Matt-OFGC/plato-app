import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Get inventory by ID with full movement history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const inventoryId = parseInt(id);

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        recipe: true,
        movements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Get inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// Update inventory settings
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
    const inventoryId = parseInt(id);
    const body = await request.json();
    const { lowStockThreshold } = body;

    const inventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Update inventory error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}

