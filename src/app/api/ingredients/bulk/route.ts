import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";

// Bulk update ingredients (e.g., price increase across all ingredients)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ingredientIds, updates } = body;

    if (!ingredientIds || !Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid ingredient IDs" },
        { status: 400 }
      );
    }

    // Apply updates to all selected ingredients
    const result = await prisma.ingredient.updateMany({
      where: {
        id: { in: ingredientIds },
      },
      data: {
        ...updates,
        lastPriceUpdate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Failed to update ingredients" },
      { status: 500 }
    );
  }
}

// Bulk delete ingredients
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ingredientIds } = body;

    if (!ingredientIds || !Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid ingredient IDs" },
        { status: 400 }
      );
    }

    const result = await prisma.ingredient.deleteMany({
      where: {
        id: { in: ingredientIds },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete ingredients" },
      { status: 500 }
    );
  }
}

// Bulk import from CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ingredients, companyId } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: "Invalid ingredients data" },
        { status: 400 }
      );
    }

    // Import ingredients in bulk
    const created = await prisma.ingredient.createMany({
      data: ingredients.map((ing: any) => ({
        name: ing.name,
        supplier: ing.supplier,
        packQuantity: ing.packQuantity,
        packUnit: ing.packUnit,
        packPrice: ing.packPrice,
        currency: ing.currency || "GBP",
        densityGPerMl: ing.densityGPerMl || null,
        allergens: ing.allergens || [],
        notes: ing.notes || null,
        companyId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: created.count,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to import ingredients" },
      { status: 500 }
    );
  }
}

