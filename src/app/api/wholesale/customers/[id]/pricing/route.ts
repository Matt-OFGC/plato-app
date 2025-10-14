import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Get all custom pricing for a customer
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
    const customerId = parseInt(id);

    const pricing = await prisma.customerPricing.findMany({
      where: { customerId },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            yieldQuantity: true,
            yieldUnit: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { recipe: { name: "asc" } },
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Get customer pricing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

// Set or update custom pricing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customerId = parseInt(id);
    const body = await request.json();
    const { recipeId, price, unit, notes } = body;

    if (!recipeId || price === undefined) {
      return NextResponse.json(
        { error: "Recipe ID and price are required" },
        { status: 400 }
      );
    }

    const pricing = await prisma.customerPricing.upsert({
      where: {
        customerId_recipeId: {
          customerId,
          recipeId,
        },
      },
      create: {
        customerId,
        recipeId,
        price,
        unit: unit || "each",
        notes,
      },
      update: {
        price,
        unit: unit || "each",
        notes,
      },
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
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Set customer pricing error:", error);
    return NextResponse.json(
      { error: "Failed to set pricing" },
      { status: 500 }
    );
  }
}

// Delete custom pricing
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
    const customerId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get("recipeId");

    if (!recipeId) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
        { status: 400 }
      );
    }

    await prisma.customerPricing.delete({
      where: {
        customerId_recipeId: {
          customerId,
          recipeId: parseInt(recipeId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete customer pricing error:", error);
    return NextResponse.json(
      { error: "Failed to delete pricing" },
      { status: 500 }
    );
  }
}

