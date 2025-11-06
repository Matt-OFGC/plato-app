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

    // Temporarily disabled to fix build error
    // Check Recipes trial limits
    if (user?.id) {
      // const isTrial = await isRecipesTrial(user.id);
      const isTrial = false; // Temporarily allow all
      if (isTrial) {
        // Check if adding these ingredients would exceed limit
        const currentCount = user.ingredientCount || 0;
        if (currentCount + ingredients.length > (user.maxIngredients || 10)) {
          return NextResponse.json(
            {
              error: "Ingredient limit reached",
              message: `You can only add ${(user.maxIngredients || 10) - currentCount} more ingredients on trial. Upgrade to Recipes Pro (£10/month) for unlimited ingredients.`,
            },
            { status: 403 }
          );
        }
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