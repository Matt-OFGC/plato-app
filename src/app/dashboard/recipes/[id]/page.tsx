import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import RecipeClient from "./RecipeClient";
import type { RecipeMock, Ingredient, RecipeStep } from "@/lib/mocks/recipe";
import { getOrCompute, CacheKeys, CACHE_TTL } from "@/lib/redis";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const isNew = idParam === "new";
  
  const { companyId } = await getCurrentUserAndCompany();
  
  if (!isNew && (!companyId)) {
    redirect("/dashboard/recipes");
  }
  
  // Fetch recipe if editing existing recipe
  let recipe = null;
  if (!isNew) {
    const id = Number(idParam);
    if (isNaN(id)) {
      redirect("/dashboard/recipes");
    }
    
    recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            items: {
              include: {
                ingredient: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      redirect("/dashboard/recipes");
    }
    
    // Security check: Verify recipe belongs to user's company
    if (recipe.companyId !== companyId) {
      redirect("/dashboard/recipes");
    }
  }

  // Fetch categories, storage, shelf life options, and ingredients for dropdowns with Redis caching
  const [categories, storageOptions, shelfLifeOptions, availableIngredientsRaw] = await Promise.all([
    getOrCompute(
      CacheKeys.categories(companyId),
      async () => {
        return await prisma.category.findMany({
          where: { companyId },
          orderBy: { order: "asc" },
          select: { id: true, name: true, description: true, color: true }
        });
      },
      CACHE_TTL.CATEGORIES
    ),
    getOrCompute(
      `company:${companyId}:storage-options`,
      async () => {
        return await prisma.storageOption.findMany({
          where: { companyId },
          orderBy: { order: "asc" },
          select: { id: true, name: true, description: true, icon: true }
        });
      },
      CACHE_TTL.STATIC_DATA
    ),
    getOrCompute(
      `company:${companyId}:shelf-life-options`,
      async () => {
        return await prisma.shelfLifeOption.findMany({
          where: { companyId },
          orderBy: { order: "asc" },
          select: { id: true, name: true, description: true }
        });
      },
      CACHE_TTL.STATIC_DATA
    ),
    getOrCompute(
      CacheKeys.ingredients(companyId),
      async () => {
        return await prisma.ingredient.findMany({
          where: { companyId },
          orderBy: { name: "asc" },
          select: { 
            id: true, 
            name: true, 
            packUnit: true,
            originalUnit: true,
            packPrice: true,
            packQuantity: true,
            densityGPerMl: true,
            allergens: true,
            batchPricing: true,
            portionSize: true,
            portionUnit: true
          }
        });
      },
      CACHE_TTL.INGREDIENTS
    ),
  ]);

  // Convert Prisma Decimal fields to numbers for client components
  const availableIngredients = availableIngredientsRaw.map(ing => ({
    ...ing,
    packPrice: ing.packPrice.toNumber(),
    packQuantity: ing.packQuantity.toNumber(),
    densityGPerMl: ing.densityGPerMl?.toNumber() || null,
    portionSize: ing.portionSize?.toNumber() || null,
    batchPricing: ing.batchPricing ? (typeof ing.batchPricing === 'string' ? JSON.parse(ing.batchPricing) : ing.batchPricing) : null,
  }));

  // Helper function to clean instruction text (remove leading numbers like "1. ", "1)", "1 -", etc.)
  const cleanInstructionLine = (line: string): string => {
    // Remove leading numbers with dots, parentheses, or dashes (e.g., "1. ", "2) ", "3 - ", etc.)
    return line.replace(/^\s*\d+[\.\)\-\:]\s*/, '').trim();
  };

  // Transform database recipe to match the new UI format
  // For new recipes, use empty/default values
  const transformedRecipe: RecipeMock = recipe ? {
    id: recipe.id.toString(),
    title: recipe.name,
    category: recipe.category || undefined,
    imageUrl: recipe.imageUrl || undefined,
    baseServings: Number(recipe.yieldQuantity),
    allergens: (recipe as any).allergens as string[] | undefined,
    storage: recipe.storage || undefined,
    shelfLife: recipe.shelfLife || undefined,
    notes: (recipe as any).notes || undefined,
    sellPrice: (recipe as any).sellingPrice ? Number((recipe as any).sellingPrice) : undefined,
    
    // Transform sections to steps
    // If no sections, create a single step from the recipe method
    steps: recipe.sections.length > 0
      ? recipe.sections.map((section, index) => ({
          id: section.id.toString(),
          title: section.title || section.description || `Step ${index + 1}`,
          // Use database values (bakeTemp, bakeTime, hasTimer)
          temperatureC: section.bakeTemp ? Number(section.bakeTemp) : undefined,
          durationMin: section.bakeTime ? Number(section.bakeTime) : undefined,
          hasTimer: section.hasTimer,
          instructions: section.method 
            ? section.method.split('\n').filter(Boolean).map(cleanInstructionLine)
            : section.description ? [cleanInstructionLine(section.description)] : [],
        })) as RecipeStep[]
      : [{
          id: '1',
          title: 'Instructions',
          temperatureC: 180, // Demo data
          durationMin: 25,   // Demo data
          hasTimer: true,    // Demo data
          instructions: recipe.method 
            ? recipe.method.split('\n').filter(Boolean).map(cleanInstructionLine)
            : [],
        }] as RecipeStep[],
    
    // Transform items to ingredients
    // Only load ingredients that are associated with sections (steps)
    // Old flat items are ignored - user needs to re-add them through the new interface
    ingredients: recipe.sections.length > 0 && recipe.sections.some(s => s.items.length > 0)
      ? recipe.sections.flatMap((section) => 
          section.items.map((item) => {
            // Calculate cost per unit
            const costPerUnit = item.ingredient.packPrice && item.ingredient.packQuantity
              ? Number(item.ingredient.packPrice) / Number(item.ingredient.packQuantity)
              : undefined;
            
            return {
              id: `item-${item.id}`,
              name: item.ingredient.name,
              unit: item.unit as Ingredient["unit"],
              quantity: Number(item.quantity),
              costPerUnit,
              stepId: section.id.toString(),
            } as Ingredient;
          })
        )
      : [], // Empty array - old recipes start fresh with new system
  } : {
    id: "new",
    title: "",
    baseServings: 1,
    steps: [{
      id: '1',
      title: 'Instructions',
      instructions: [],
    }] as RecipeStep[],
    ingredients: [],
  };

  const recipeId = recipe ? recipe.id : null;

  // Transform ingredients for dropdown
  // Note: availableIngredients are already converted from Decimal to number above
  const ingredientsForDropdown = availableIngredients.map(ing => {
    return {
      id: ing.id,
      name: ing.name,
      unit: ing.packUnit,
      costPerUnit: ing.packPrice && ing.packQuantity && ing.packQuantity > 0
        ? ing.packPrice / ing.packQuantity
        : 0,
      // Include full data for proper cost calculation with unit conversion
      // packQuantity is already in base units, packUnit is the base unit
      packPrice: ing.packPrice,
      packQuantity: ing.packQuantity,
      packUnit: ing.packUnit, // This is the base unit (g, ml, each) - packQuantity is already in this unit
      densityGPerMl: ing.densityGPerMl,
      allergens: ing.allergens || [],
    };
  });

  return (
    <RecipeClient 
      recipe={transformedRecipe} 
      categories={categories}
      storageOptions={storageOptions}
      shelfLifeOptions={shelfLifeOptions}
      recipeId={recipeId}
      availableIngredients={ingredientsForDropdown}
      isNew={isNew}
    />
  );
}
