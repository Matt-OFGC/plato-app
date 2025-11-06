import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipes } = await request.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      return NextResponse.json({ error: "Invalid recipes data" }, { status: 400 });
    }

    // Create recipes in batch
    const createdRecipes = [];
    
    for (const recipe of recipes) {
      const createdRecipe = await prisma.recipe.create({
        data: {
          name: recipe.name,
          description: recipe.description,
          yieldQuantity: recipe.yieldQuantity || 1,
          yieldUnit: recipe.yieldUnit || "each",
          category: recipe.category,
          sellingPrice: recipe.sellingPrice,
          companyId,
          method: recipe.estimatedIngredients ? 
            `Estimated ingredients: ${recipe.estimatedIngredients.join(", ")}` : 
            undefined,
        },
      });
      
      createdRecipes.push(createdRecipe);
    }

    return NextResponse.json({
      success: true,
      count: createdRecipes.length,
      message: `Successfully created ${createdRecipes.length} recipes`
    });

  } catch (error) {
    console.error("Bulk recipe creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create recipes",
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
