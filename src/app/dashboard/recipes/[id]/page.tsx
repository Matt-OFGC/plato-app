import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipePageInlineComplete } from "@/components/RecipePageInlineComplete";
import { redirect } from "next/navigation";
import { updateRecipeUnified } from "../actionsSimplified";
import { calculateRecipeCost } from "@/lib/recipeCostCalculator";

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
        packPrice: true,
        densityGPerMl: true,
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

  // Calculate cost breakdown
  let costBreakdown = {
    ingredientCosts: [],
    subRecipeCosts: [],
    totalCost: 0,
    costPerOutputUnit: 0,
  };

  try {
    const recipeData = {
      id: recipe.id,
      name: recipe.name,
      yieldQuantity: Number(recipe.yieldQuantity),
      yieldUnit: recipe.yieldUnit as "g" | "ml" | "each",
      ingredients: recipe.items.map(item => ({
        ingredientId: item.ingredientId,
        quantity: Number(item.quantity),
        unit: item.unit as any,
      })),
      subRecipes: [],
    };

    const ingredientsData = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      packQuantity: Number(ing.packQuantity),
      packUnit: ing.packUnit as "g" | "ml" | "each",
      packPrice: Number(ing.packPrice),
      densityGPerMl: ing.densityGPerMl ? Number(ing.densityGPerMl) : null,
    }));

    // Only fetch sub-recipes if this recipe actually has any (optimization)
    const allRecipesData: any[] = []; // Empty for now since sub-recipes aren't being used

    const fullCostBreakdown = calculateRecipeCost(recipeData, ingredientsData, allRecipesData);
    costBreakdown = {
      ingredientCosts: [],
      subRecipeCosts: [],
      totalCost: fullCostBreakdown.totalCost,
      costPerOutputUnit: fullCostBreakdown.costPerOutputUnit
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
    sections: recipe.sections.map(section => ({
      ...section,
      description: section.description || undefined,
      method: section.method || undefined,
      items: section.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
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
  }));

  return (
    <RecipePageInlineComplete
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
