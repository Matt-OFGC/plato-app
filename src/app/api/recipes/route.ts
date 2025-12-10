import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

// GET /api/recipes - Get all recipes
export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeFullData = searchParams.get("full") === "true";
    const search = searchParams.get("search");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const where: any = { companyId };
    
    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { category: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const recipesRaw = await prisma.recipe.findMany({
      where,
      orderBy: { name: "asc" },
      take: limit,
      include: includeFullData ? {
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
      } : undefined
    });

    const recipes = recipesRaw.map(recipe => ({
      id: recipe.id,
      name: recipe.name,
      description: recipe.method || null,
      imageUrl: recipe.imageUrl || null,
      category: recipe.category || null,
      yieldQuantity: recipe.yieldQuantity.toString(),
      yieldUnit: recipe.yieldUnit || "each",
      sellingPrice: recipe.sellingPrice?.toString() || null,
      wholesalePrice: recipe.wholesalePrice?.toString() || null,
      storage: recipe.storage || null,
      shelfLife: recipe.shelfLife || null,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      ...(includeFullData && {
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
      })
    }));

    return createOptimizedResponse(recipes, {
      cacheType: includeFullData ? 'dynamic' : 'frequent',
      compression: false,
    });
  } catch (error) {
    logger.error("Error fetching recipes", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to fetch recipes", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create a new recipe
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, category, yieldQuantity, yieldUnit, sellingPrice, storage, shelfLife, imageUrl, ingredients, steps } = body;

    if (!name || !yieldQuantity) {
      return NextResponse.json({ error: "Name and yield quantity are required" }, { status: 400 });
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const newRecipe = await tx.recipe.create({
        data: {
          name: name.trim(),
          method: description || null,
          yieldQuantity: parseFloat(yieldQuantity),
          yieldUnit: yieldUnit || "each",
          category: category || null,
          storage: storage || null,
          storageId: storageOption?.id || null,
          shelfLife: shelfLife || null,
          shelfLifeId: shelfLifeOption?.id || null,
          sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
          imageUrl: imageUrl || null,
          companyId,
        },
      });

      // Create sections and items if provided
      if (steps && Array.isArray(steps)) {
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const methodText = step.instructions?.join('\n') || step.method || null;
          
          const newSection = await tx.recipeSection.create({
            data: {
              recipeId: newRecipe.id,
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
                    recipeId: newRecipe.id,
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

      return newRecipe;
    });

    return NextResponse.json({ success: true, recipeId: result.id }, { status: 201 });
  } catch (error) {
    logger.error("Error creating recipe", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to create recipe", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


