import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { canAddIngredient, updateIngredientCount } from "@/lib/subscription";
// Temporarily disabled to fix build error
// import { isRecipesTrial } from "@/lib/features";

export async function POST(request: NextRequest) {
  try {
    const { companyId, user } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ingredients } = await request.json();

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Invalid ingredients data" }, { status: 400 });
    }

    // Check subscription limits using the tier-based system
    if (user?.id) {
      const { canAddIngredient } = await import("@/lib/subscription");
      if (!(await canAddIngredient(user.id))) {
        return NextResponse.json(
          {
            error: "Ingredient limit reached",
            message: `You've reached the ingredient limit for your subscription tier. Upgrade to paid tier for unlimited ingredients.`,
          },
          { status: 403 }
        );
      }
    }

    // Create ingredients in batch
    const createdIngredients = await prisma.ingredient.createMany({
      data: ingredients.map((ingredient: any) => ({
        name: ingredient.name,
        packQuantity: ingredient.packQuantity,
        packUnit: ingredient.packUnit,
        packPrice: ingredient.packPrice,
        currency: ingredient.currency || "GBP",
        companyId,
        // Set default values for required fields
        densityGPerMl: null,
        supplier: "Imported",
        notes: "Imported from invoice scan",
        lastPriceUpdate: new Date(),
      })),
      skipDuplicates: true, // Skip if ingredient with same name already exists
    });

    // Update ingredient count
    if (user?.id && createdIngredients.count > 0) {
      await updateIngredientCount(user.id);
    }

    return NextResponse.json({
      success: true,
      count: createdIngredients.count,
      message: `Successfully created ${createdIngredients.count} ingredients`
    });

  } catch (error) {
    console.error("Bulk ingredient creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create ingredients",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}