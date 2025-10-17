import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipePageInlineCompleteV2 } from "@/components/RecipePageInlineCompleteV2";
import { redirect } from "next/navigation";
import { updateRecipeUnified } from "../actionsSimplified";
import { calculateRecipeCost } from "@/lib/recipeCostCalculator";
import { calculateTotalRecipeCost, calculateCostPerOutputUnit, getAllergensFromRecipeItems } from "@/lib/recipe-calculations";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  
  const recipe = await prisma.recipe.findUnique({
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

  // Get only the data we need for this recipe
  const [ingredients, categories, shelfLifeOptions, storageOptions, wholesaleProduct] = await Promise.all([
    prisma.ingredient.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        packQuantity: true,
        packUnit: true,
        originalUnit: true,
        packPrice: true,
        densityGPerMl: true,
        allergens: true,
      }
    }),
    prisma.category.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.shelfLifeOption.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.storageOption.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.wholesaleProduct.findFirst({
      where: {
        recipeId: id,
        companyId: companyId!,
      },
      select: {
        id: true,
        price: true,
        isActive: true,
      }
    }),
  ]);

  // Calculate cost breakdown using new utility functions
  let costBreakdown = {
    ingredientCosts: [],
    subRecipeCosts: [],
    totalCost: 0,
    costPerOutputUnit: 0,
  };

  try {
    // Prepare recipe items with ingredient data for cost calculation
    const recipeItemsWithIngredients = recipe.items.map(item => ({
      quantity: Number(item.quantity),
      unit: item.unit as any,
      ingredient: {
        packPrice: Number(item.ingredient.packPrice),
        packQuantity: Number(item.ingredient.packQuantity),
        packUnit: item.ingredient.packUnit as any,
        densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
      }
    }));

    // Calculate total cost using new utility function
    const totalCost = calculateTotalRecipeCost(recipeItemsWithIngredients);
    const costPerOutputUnit = calculateCostPerOutputUnit(totalCost, Number(recipe.yieldQuantity), recipe.yieldUnit);

    costBreakdown = {
      ingredientCosts: [],
      subRecipeCosts: [],
      totalCost,
      costPerOutputUnit
    };
  } catch (error) {
    console.error('Cost calculation error:', error);
  }

  // Transform recipe data for the component
  const transformedRecipe = {
    ...recipe,
    description: recipe.description || undefined,
    yieldQuantity: Number(recipe.yieldQuantity),
    imageUrl: recipe.imageUrl || undefined,
    method: recipe.method || undefined,
    category: recipe.category ? { id: recipe.categoryId || 0, name: recipe.category } : null,
    storage: recipe.storage ? { id: recipe.storageId || 0, name: recipe.storage } : null,
    shelfLife: recipe.shelfLife ? { id: recipe.shelfLifeId || 0, name: recipe.shelfLife } : null,
    sections: recipe.sections.map(section => ({
      ...section,
      description: section.description || undefined,
      method: section.method || undefined,
      items: section.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        price: item.price ? Number(item.price) : undefined,
        note: item.note || undefined,
        ingredient: {
          id: item.ingredient.id,
          name: item.ingredient.name,
          packQuantity: Number(item.ingredient.packQuantity),
          packUnit: item.ingredient.packUnit,
          packPrice: Number(item.ingredient.packPrice),
          densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined
        }
      }))
    })),
    items: recipe.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      price: item.price ? Number(item.price) : undefined,
      note: item.note || undefined,
      ingredient: {
        id: item.ingredient.id,
        name: item.ingredient.name,
        packQuantity: Number(item.ingredient.packQuantity),
        packUnit: item.ingredient.packUnit,
        packPrice: Number(item.ingredient.packPrice),
        densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined
      }
    }))
  };

  const transformedIngredients = ingredients.map(ing => ({
    id: ing.id,
    name: ing.name,
    packQuantity: Number(ing.packQuantity),
    packUnit: ing.packUnit,
    packPrice: Number(ing.packPrice),
    densityGPerMl: ing.densityGPerMl ? Number(ing.densityGPerMl) : null,
    allergens: ing.allergens && typeof ing.allergens === 'string' 
      ? ing.allergens.split(',').map(a => a.trim()).filter(a => a.length > 0) 
      : Array.isArray(ing.allergens) 
        ? ing.allergens 
        : [],
  }));

  return (
    <RecipePageInlineCompleteV2
      recipe={transformedRecipe}
      costBreakdown={costBreakdown}
      ingredients={transformedIngredients}
      categories={categories}
      shelfLifeOptions={shelfLifeOptions}
      storageOptions={storageOptions}
      wholesaleProduct={wholesaleProduct ? {
        id: wholesaleProduct.id,
        price: wholesaleProduct.price.toString(),
        isActive: wholesaleProduct.isActive,
      } : null}
      onSave={updateRecipeUnified}
    />
  );
}
