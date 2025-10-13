import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planId = parseInt(params.id);

    // Get production plan with all items and ingredients
    const plan = await prisma.productionPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: {
            recipe: {
              include: {
                items: {
                  include: {
                    ingredient: true,
                  },
                },
                sections: {
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
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Aggregate ingredients across all recipes
    const ingredientMap = new Map<number, {
      ingredient: any;
      totalQuantity: Decimal;
      unit: string;
      recipes: string[];
    }>();

    plan.items.forEach((productionItem) => {
      const recipe = productionItem.recipe;
      const quantity = productionItem.quantity;

      // Get all ingredients (from sections or direct items)
      const recipeItems = recipe.sections.length > 0
        ? recipe.sections.flatMap(s => s.items)
        : recipe.items;

      recipeItems.forEach((item) => {
        const ingredientId = item.ingredient.id;
        const itemQuantity = new Decimal(item.quantity.toString()).times(quantity);

        const existing = ingredientMap.get(ingredientId);

        if (existing) {
          existing.totalQuantity = existing.totalQuantity.plus(itemQuantity);
          if (!existing.recipes.includes(recipe.name)) {
            existing.recipes.push(recipe.name);
          }
        } else {
          ingredientMap.set(ingredientId, {
            ingredient: item.ingredient,
            totalQuantity: itemQuantity,
            unit: item.unit,
            recipes: [recipe.name],
          });
        }
      });
    });

    // Convert to array and serialize
    const shoppingList = Array.from(ingredientMap.values()).map(item => ({
      ingredient: {
        id: item.ingredient.id,
        name: item.ingredient.name,
        packQuantity: item.ingredient.packQuantity.toString(),
        packUnit: item.ingredient.packUnit,
        packPrice: item.ingredient.packPrice.toString(),
        currency: item.ingredient.currency,
      },
      totalQuantity: item.totalQuantity.toString(),
      unit: item.unit,
      recipes: item.recipes,
      // Calculate packs needed
      packsNeeded: Math.ceil(
        item.totalQuantity.div(new Decimal(item.ingredient.packQuantity.toString())).toNumber()
      ),
    })).sort((a, b) => a.ingredient.name.localeCompare(b.ingredient.name));

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        endDate: plan.endDate,
      },
      shoppingList,
    });
  } catch (error) {
    console.error("Shopping list error:", error);
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    );
  }
}

