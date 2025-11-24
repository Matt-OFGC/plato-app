import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";
import { createOptimizedResponse } from "@/lib/api-optimization";

export async function GET(request: NextRequest) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeFullData = searchParams.get("full") === "true";

    // Fetch recipes - use include pattern similar to recipe detail page
    let recipesRaw;
    try {
      const includeObject: any = {};

      if (includeFullData) {
        includeObject.items = {
          include: {
            ingredient: true,
          },
        };
        includeObject.sections = {
          include: {
            items: {
              include: {
                ingredient: true,
              },
            },
          },
          orderBy: { order: "asc" },
        };
      }

      recipesRaw = await prisma.recipe.findMany({
        where: { companyId },
        orderBy: { name: "asc" },
        include: includeObject,
      });
      logger.debug(`Fetched ${recipesRaw.length} recipes`, null, "Recipes");
    } catch (prismaError: any) {
      logger.error("Prisma query error", prismaError, "Recipes");
      logger.debug("Error details", {
        message: prismaError?.message,
        code: prismaError?.code,
        meta: prismaError?.meta,
      }, "Recipes");
      throw prismaError;
    }

    // Transform recipes to include aggregated allergen data
    const recipes = recipesRaw.map((recipe) => {
      // Aggregate allergens from all ingredients
      const allergenSet = new Set<string>();
      
      if (includeFullData && recipe.items) {
        // Get allergens from all items (both direct items and section items)
        const allItems = [
          ...(Array.isArray(recipe.items) ? recipe.items : []),
          ...(Array.isArray(recipe.sections) ? recipe.sections.flatMap((s: any) => Array.isArray(s.items) ? s.items : []) : [])
        ];
        
        allItems.forEach((item: any) => {
          if (item?.ingredient?.allergens) {
            try {
              const allergens = Array.isArray(item.ingredient.allergens) 
                ? item.ingredient.allergens 
                : JSON.parse(item.ingredient.allergens || '[]');
              if (Array.isArray(allergens)) {
                allergens.forEach((allergen: string) => allergenSet.add(allergen));
              }
            } catch (e) {
              logger.warn('Failed to parse allergens for ingredient', e, "Recipes");
            }
          }
        });
      }
      
      // Include recipe-level allergens if they exist
      if (recipe.allergens) {
        try {
          const recipeAllergens = Array.isArray(recipe.allergens)
            ? recipe.allergens
            : JSON.parse(recipe.allergens || '[]');
          if (Array.isArray(recipeAllergens)) {
            recipeAllergens.forEach((allergen: string) => allergenSet.add(allergen));
          }
        } catch (e) {
          logger.warn('Failed to parse recipe allergens', e, "Recipes");
        }
      }

      // Convert Decimal fields to numbers safely
      let sellingPrice: number | undefined;
      try {
        if (recipe.sellingPrice) {
          sellingPrice = typeof recipe.sellingPrice === 'object' && 'toNumber' in recipe.sellingPrice
            ? recipe.sellingPrice.toNumber()
            : Number(recipe.sellingPrice);
        }
      } catch (e) {
        logger.warn('Failed to convert sellingPrice for recipe', e, "Recipes");
      }

      const result: any = {
        id: recipe.id,
        name: recipe.name || '',
        description: recipe.description || null,
        image_url: recipe.imageUrl || null,
        selling_price: sellingPrice,
        category: recipe.category || undefined,
        allergens: Array.from(allergenSet).sort(),
        dietary_tags: [], // TODO: Calculate dietary tags based on allergens
        shelf_life: recipe.shelfLife || undefined,
        storage: recipe.storage || undefined,
        has_recent_changes: false, // TODO: Track recipe changes
      };

      if (includeFullData && recipe.items) {
        result.items = (Array.isArray(recipe.items) ? recipe.items : []).map((item: any) => ({
          id: item.id,
          quantity: typeof item.quantity === 'object' && 'toNumber' in item.quantity
            ? item.quantity.toNumber()
            : Number(item.quantity || 0),
          unit: item.unit || '',
          ingredient: item.ingredient ? {
            id: item.ingredient.id,
            name: item.ingredient.name || '',
            allergens: Array.isArray(item.ingredient.allergens)
              ? item.ingredient.allergens
              : (typeof item.ingredient.allergens === 'string' 
                  ? (() => {
                      try {
                        return JSON.parse(item.ingredient.allergens || '[]');
                      } catch {
                        return [];
                      }
                    })()
                  : []),
          } : null,
        }));
      }
      
      if (includeFullData && recipe.sections) {
        // Sort sections by order before mapping
        const sortedSections = Array.isArray(recipe.sections) 
          ? [...recipe.sections].sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
          : [];
        result.sections = sortedSections.map((section: any) => ({
          id: section.id,
          title: section.title || '',
          items: (Array.isArray(section.items) ? section.items : []).map((item: any) => ({
            id: item.id,
            quantity: typeof item.quantity === 'object' && 'toNumber' in item.quantity
              ? item.quantity.toNumber()
              : Number(item.quantity || 0),
            unit: item.unit || '',
            ingredient: item.ingredient ? {
              id: item.ingredient.id,
              name: item.ingredient.name || '',
              allergens: Array.isArray(item.ingredient.allergens)
                ? item.ingredient.allergens
                : (typeof item.ingredient.allergens === 'string' 
                    ? (() => {
                        try {
                          return JSON.parse(item.ingredient.allergens || '[]');
                        } catch {
                          return [];
                        }
                      })()
                    : []),
            } : null,
          })),
        }));
      }

      return result;
    });

    return createOptimizedResponse(recipes, {
      cacheType: includeFullData ? 'dynamic' : 'frequent',
      compression: true,
    });
  } catch (error) {
    logger.error("Error fetching recipes", error, "Recipes");
    return NextResponse.json(
      { error: "Failed to fetch recipes", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

