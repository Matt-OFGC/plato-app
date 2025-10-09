import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { RecipePrintView } from "@/components/RecipePrintView";
import { computeRecipeCost, computeIngredientUsageCost } from "@/lib/units";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipePrintPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  
  const { companyId } = await getCurrentUserAndCompany();
  
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
      categoryRef: true,
      storageRef: true,
      shelfLifeRef: true,
    },
  });

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <Link href="/dashboard/recipes" className="text-emerald-600 hover:text-emerald-700">
            ← Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  // Calculate costs for all ingredients
  const itemsWithCosts = recipe.items.map(item => ({
    quantity: Number(item.quantity),
    unit: item.unit,
    ingredient: {
      name: item.ingredient.name,
    },
    cost: computeIngredientUsageCost({
      usageQuantity: Number(item.quantity),
      usageUnit: item.unit,
      ingredient: {
        packQuantity: Number(item.ingredient.packQuantity),
        packUnit: item.ingredient.packUnit,
        packPrice: Number(item.ingredient.packPrice),
        densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
      }
    })
  }));

  // Calculate costs for sections
  const sectionsWithCosts = recipe.sections.map(section => ({
    title: section.title,
    description: section.description || undefined,
    method: section.method || undefined,
    items: section.items.map(item => ({
      quantity: Number(item.quantity),
      unit: item.unit,
      ingredient: {
        name: item.ingredient.name,
      },
      cost: computeIngredientUsageCost({
        usageQuantity: Number(item.quantity),
        usageUnit: item.unit,
        ingredient: {
          packQuantity: Number(item.ingredient.packQuantity),
          packUnit: item.ingredient.packUnit,
          packPrice: Number(item.ingredient.packPrice),
          densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
        }
      })
    }))
  }));

  // Calculate total cost
  const totalCost = computeRecipeCost({
    items: recipe.items.map(item => ({
      quantity: Number(item.quantity),
      unit: item.unit,
      ingredient: {
        packQuantity: Number(item.ingredient.packQuantity),
        packUnit: item.ingredient.packUnit,
        packPrice: Number(item.ingredient.packPrice),
        densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
      }
    }))
  });

  const costPerUnit = totalCost / Number(recipe.yieldQuantity);

  // Prepare data for RecipePrintView
  const printRecipe = {
    name: recipe.name,
    description: recipe.description || undefined,
    yieldQuantity: Number(recipe.yieldQuantity),
    yieldUnit: recipe.yieldUnit,
    imageUrl: recipe.imageUrl || undefined,
    bakeTime: recipe.bakeTime || undefined,
    bakeTemp: recipe.bakeTemp || undefined,
    storage: recipe.storageRef?.name || recipe.storage || undefined,
    shelfLife: recipe.shelfLifeRef?.name || recipe.shelfLife || undefined,
    category: recipe.categoryRef?.name || recipe.category || undefined,
    method: recipe.method || undefined,
    currentPrice: recipe.currentPrice ? Number(recipe.currentPrice) : undefined,
    targetMargin: recipe.targetMargin ? Number(recipe.targetMargin) : undefined,
    sections: sectionsWithCosts,
    items: itemsWithCosts,
    totalCost,
    costPerUnit,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <RecipePrintView recipe={printRecipe} currency="GBP" />
    </div>
  );
}

