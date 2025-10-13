import { getUserFromSession } from "@/lib/auth-simple";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { computeRecipeCost } from "@/lib/units";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const user = await getUserFromSession();
  if (!user) redirect("/login");

  const { companyId } = await getCurrentUserAndCompany();
  if (!companyId) {
    redirect("/dashboard");
  }

  // Get recipes with cost data
  const recipes = await prisma.recipe.findMany({
    where: { companyId },
    include: {
      items: {
        include: {
          ingredient: {
            select: {
              packQuantity: true,
              packUnit: true,
              packPrice: true,
              densityGPerMl: true,
              currency: true,
            },
          },
        },
      },
      sections: {
        include: {
          items: {
            include: {
              ingredient: {
                select: {
                  packQuantity: true,
                  packUnit: true,
                  packPrice: true,
                  densityGPerMl: true,
                  currency: true,
                },
              },
            },
          },
        },
      },
      categoryRef: true,
    },
  });

  // Calculate costs for each recipe
  const recipesWithCosts = recipes.map(recipe => {
    // Collect all items from both direct items and section items
    const allItems = [
      ...recipe.items.map(item => ({
        quantity: Number(item.quantity),
        unit: item.unit,
        ingredient: {
          packQuantity: Number(item.ingredient.packQuantity),
          packUnit: item.ingredient.packUnit,
          packPrice: Number(item.ingredient.packPrice),
          densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
        }
      })),
      ...recipe.sections.flatMap(section => 
        section.items.map(item => ({
          quantity: Number(item.quantity),
          unit: item.unit,
          ingredient: {
            packQuantity: Number(item.ingredient.packQuantity),
            packUnit: item.ingredient.packUnit,
            packPrice: Number(item.ingredient.packPrice),
            densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
          }
        }))
      )
    ];

    const cost = computeRecipeCost({ items: allItems });
    
    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.categoryRef?.name || recipe.category || "Uncategorized",
      cost: cost.toString(),
      sellingPrice: recipe.sellingPrice?.toString() || null,
      actualFoodCost: recipe.actualFoodCost?.toString() || null,
      yieldQuantity: recipe.yieldQuantity.toString(),
      yieldUnit: recipe.yieldUnit,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
    };
  });

  // Get ingredient price trends
  const ingredients = await prisma.ingredient.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      packPrice: true,
      currency: true,
      lastPriceUpdate: true,
    },
    orderBy: { lastPriceUpdate: "desc" },
  });

  const ingredientsData = ingredients.map(ing => ({
    ...ing,
    packPrice: ing.packPrice.toString(),
    lastPriceUpdate: ing.lastPriceUpdate.toISOString(),
  }));

  // Get recipe count by category
  const categoryStats = await prisma.category.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { recipes: true },
      },
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics & Insights
        </h1>
        <p className="text-gray-600">
          Track costs, profitability, and business metrics
        </p>
      </div>

      <AnalyticsDashboard
        recipes={recipesWithCosts}
        ingredients={ingredientsData}
        categories={categoryStats}
      />
    </div>
  );
}

