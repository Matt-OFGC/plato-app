import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Get all inventory for a company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const inventory = await prisma.inventory.findMany({
      where: { companyId: parseInt(companyId) },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
            category: true,
            imageUrl: true,
          },
        },
        movements: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { recipe: { name: "asc" } },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Get inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

// Create or update inventory record
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, recipeId, quantity, unit, lowStockThreshold, type, reason, notes } = body;

    if (!companyId || !recipeId || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get or create inventory record
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { yieldUnit: true },
    });

    const inventoryUnit = unit || recipe?.yieldUnit || "each";

    const inventory = await prisma.inventory.upsert({
      where: {
        companyId_recipeId: {
          companyId,
          recipeId,
        },
      },
      create: {
        companyId,
        recipeId,
        quantity: quantity,
        unit: inventoryUnit,
        lowStockThreshold,
        lastRestocked: new Date(),
        movements: {
          create: {
            type: type || "adjustment",
            quantity: quantity,
            reason: reason || "Initial stock",
            notes,
            createdBy: session.id,
          },
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(quantity > 0 && { lastRestocked: new Date() }),
        movements: {
          create: {
            type: type || "adjustment",
            quantity: quantity,
            reason,
            notes,
            createdBy: session.id,
          },
        },
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            yieldUnit: true,
          },
        },
        movements: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
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

