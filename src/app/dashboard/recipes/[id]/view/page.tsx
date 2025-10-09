import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { calculateRecipeCost } from "@/lib/recipeCostCalculator";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipeCookingView } from "@/components/RecipeCookingView";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipeViewPage({ params }: Props) {
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
      subRecipes: {
        include: {
          subRecipe: {
            include: {
              items: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Recipe Not Found</h1>
          <Link href="/dashboard/recipes" className="text-[var(--primary)] hover:text-[var(--accent)]">
            ← Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  // Get all ingredients and recipes for cost calculation
  const [ingredients, allRecipes] = await Promise.all([
    prisma.ingredient.findMany({ where, orderBy: { name: "asc" } }),
    prisma.recipe.findMany({ 
      where, 
      orderBy: { name: "asc" },
      include: { items: true }
    }),
  ]);

  // Calculate cost breakdown (simplified for now)
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
      subRecipes: recipe.subRecipes.map(sr => ({
        subRecipeId: sr.subRecipeId,
        quantity: Number(sr.quantity),
        unit: sr.unit as any,
      })),
    };

    const ingredientsData = ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      packQuantity: Number(ing.packQuantity),
      packUnit: ing.packUnit as "g" | "ml" | "each",
      packPrice: Number(ing.packPrice),
      densityGPerMl: ing.densityGPerMl ? Number(ing.densityGPerMl) : null,
    }));

    const allRecipesData = allRecipes.map(r => ({
      id: r.id,
      name: r.name,
      yieldQuantity: Number(r.yieldQuantity),
      yieldUnit: r.yieldUnit as "g" | "ml" | "each",
      ingredients: r.items ? r.items.map(item => ({
        ingredientId: item.ingredientId,
        quantity: Number(item.quantity),
        unit: item.unit as any,
      })) : [],
      subRecipes: [],
    }));

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Link 
          href="/dashboard/recipes" 
          className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recipes
        </Link>
        <Link 
          href={`/dashboard/recipes/${id}/print`}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Recipe
        </Link>
      </div>

      <RecipeCookingView 
        recipe={{
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
        }} 
        costBreakdown={costBreakdown} 
      />
    </div>
  );
}
