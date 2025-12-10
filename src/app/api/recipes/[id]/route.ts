import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

// GET /api/recipes/[id] - Get a single recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const recipeId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        items: {
          include: { ingredient: true }
        },
        sections: {
          include: {
            items: {
              include: { ingredient: true }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!recipe || recipe.companyId !== companyId) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    const recipeData = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.method || null,
      imageUrl: recipe.imageUrl || null,
      category: recipe.category || null,
      yieldQuantity: recipe.yieldQuantity.toString(),
      yieldUnit: recipe.yieldUnit || "each",
      sellingPrice: recipe.sellingPrice?.toString() || null,
      storage: recipe.storage || null,
      shelfLife: recipe.shelfLife || null,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      items: recipe.items?.map(item => ({
        id: item.id,
        quantity: item.quantity.toString(),
        unit: item.unit,
        ingredient: item.ingredient ? {
          id: item.ingredient.id,
          name: item.ingredient.name
        } : null
      })) || [],
      sections: recipe.sections?.map(section => ({
        id: section.id,
        title: section.title || "",
        method: section.method || null,
        order: section.order,
        bakeTemp: section.bakeTemp || null,
        bakeTime: section.bakeTime || null,
        items: section.items?.map(item => ({
          id: item.id,
          quantity: item.quantity.toString(),
          unit: item.unit,
          ingredient: item.ingredient ? {
            id: item.ingredient.id,
            name: item.ingredient.name
          } : null
        })) || []
      })) || []
    };

    return createOptimizedResponse(recipeData, {
      cacheType: 'dynamic',
      compression: false,
    });
  } catch (error) {
    logger.error("Error fetching recipe", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to fetch recipe", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/recipes/[id] - Update a recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const recipeId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Verify recipe belongs to company
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { companyId: true }
    });

    if (!existingRecipe || existingRecipe.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, yieldQuantity, yieldUnit, sellingPrice, storage, shelfLife, imageUrl, ingredients, steps } = body;

    // Find storage and shelf life option IDs
    const [storageOption, shelfLifeOption] = await Promise.all([
      storage ? prisma.storageOption.findFirst({
        where: { name: storage, companyId },
        select: { id: true }
      }) : null,
      shelfLife ? prisma.shelfLifeOption.findFirst({
        where: { name: shelfLife, companyId },
        select: { id: true }
      }) : null,
    ]);

    await prisma.$transaction(async (tx) => {
      // Update recipe basic info
      await tx.recipe.update({
        where: { id: recipeId },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { method: description }),
          ...(yieldQuantity && { yieldQuantity: parseFloat(yieldQuantity) }),
          ...(yieldUnit && { yieldUnit }),
          category: category || null,
          storage: storage || null,
          storageId: storageOption?.id || null,
          shelfLife: shelfLife || null,
          shelfLifeId: shelfLifeOption?.id || null,
          ...(sellingPrice !== undefined && { sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null }),
          ...(imageUrl !== undefined && { imageUrl }),
        },
      });

      // Delete existing sections and their items
      await tx.recipeItem.deleteMany({
        where: { recipeId, sectionId: { not: null } }
      });
      await tx.recipeSection.deleteMany({
        where: { recipeId }
      });

      // Create new sections and items if provided
      if (steps && Array.isArray(steps)) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const methodText = step.instructions?.join('\n') || step.method || null;
          
          const newSection = await tx.recipeSection.create({
            data: {
              recipeId,
              title: step.title || `Step ${i + 1}`,
              description: step.title || null,
              method: methodText,
              order: i,
              bakeTemp: step.temperatureC || null,
              bakeTime: step.durationMin || null,
            }
          });

          // Add ingredients to this section
          if (ingredients && Array.isArray(ingredients)) {
            const stepIngredients = ingredients.filter((ing: any) => ing.stepId === step.id);
            
            for (const ing of stepIngredients) {
              const dbIngredient = await tx.ingredient.findFirst({
                where: { name: ing.name, companyId }
              });

              if (dbIngredient) {
                await tx.recipeItem.create({
                  data: {
                    recipeId,
                    ingredientId: dbIngredient.id,
                    quantity: parseFloat(ing.quantity),
                    unit: ing.unit,
                    sectionId: newSection.id,
                  }
                });
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating recipe", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to update recipe", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/recipes/[id] - Delete a recipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const { id } = await params;
    const recipeId = parseInt(id);

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    // Verify recipe belongs to company
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { companyId: true }
    });

    if (!existingRecipe || existingRecipe.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.recipe.delete({ where: { id: recipeId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting recipe", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to delete recipe", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


