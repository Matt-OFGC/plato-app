import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 403 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    // First, check which ingredients are being used in recipes
    const ingredientsInUse = await prisma.recipeItem.findMany({
      where: {
        ingredientId: { in: ids },
      },
      select: {
        ingredientId: true,
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get unique ingredient IDs that are in use
    const usedIngredientIds = [...new Set(ingredientsInUse.map(item => item.ingredientId))];
    const usedIngredientNames = ingredientsInUse.map(item => item.ingredient.name);

    // If any ingredients are in use, return an error
    if (usedIngredientIds.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete ingredients that are used in recipes",
          usedIngredients: usedIngredientNames,
          usedCount: usedIngredientIds.length,
          message: `The following ingredients cannot be deleted because they are used in recipes: ${usedIngredientNames.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Delete ingredients that belong to the user's company and are not in use
    const result = await prisma.ingredient.deleteMany({
      where: {
        id: { in: ids },
        companyId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} ingredient(s)` 
    });
  } catch (error) {
    logger.error("Bulk delete ingredients error", error, "Ingredients");
    return NextResponse.json(
      { error: "Failed to delete ingredients" },
      { status: 500 }
    );
  }
}

