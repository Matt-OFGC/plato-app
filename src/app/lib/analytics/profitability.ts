import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

interface ProfitabilityFilters {
  companyId: number;
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  recipeIds?: number[];
}

export async function calculateRecipeProfitability(filters: ProfitabilityFilters) {
  const { companyId, startDate, endDate, categoryId, recipeIds } = filters;

  // Base query for recipes
  const whereClause: any = {
    companyId,
    ...(categoryId && { categoryId }),
    ...(recipeIds && recipeIds.length > 0 && { id: { in: recipeIds } }),
  };

  // Get all recipes with their ingredients
  const recipes = await prisma.recipe.findMany({
    where: whereClause,
    include: {
      ingredients: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              cost: true,
              unit: true,
            },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          salesRecords: {
            where: {
              ...(startDate && endDate && {
                date: {
                  gte: startDate,
                  lte: endDate,
                },
              }),
            },
          },
        },
      },
    },
  });

  // Calculate profitability for each recipe
  const results = await Promise.all(
    recipes.map(async (recipe) => {
      // Calculate recipe cost
      let recipeCost = new Decimal(0);
      for (const recipeIngredient of recipe.ingredients) {
        const unitCost = new Decimal(recipeIngredient.ingredient.cost);
        const quantity = new Decimal(recipeIngredient.quantity);
        recipeCost = recipeCost.plus(unitCost.times(quantity));
      }

      // Get sales data
      const salesRecords = await prisma.salesRecord.findMany({
        where: {
          recipeId: recipe.id,
          companyId,
          ...(startDate && endDate && {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
        select: {
          quantity: true,
          price: true,
        },
      });

      // Calculate totals
      let totalRevenue = new Decimal(0);
      let totalQuantity = 0;

      for (const sale of salesRecords) {
        totalRevenue = totalRevenue.plus(
          new Decimal(sale.price).times(sale.quantity)
        );
        totalQuantity += sale.quantity;
      }

      const batchesProduced = Math.ceil(totalQuantity / recipe.yieldQuantity);
      const totalCosts = recipeCost.times(batchesProduced);
      const grossProfit = totalRevenue.minus(totalCosts);
      const grossMargin = totalRevenue.gt(0)
        ? grossProfit.dividedBy(totalRevenue).times(100)
        : new Decimal(0);
      const foodCostPercentage = totalRevenue.gt(0)
        ? totalCosts.dividedBy(totalRevenue).times(100)
        : new Decimal(0);

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        category: recipe.category?.name || "Uncategorized",
        totalRevenue: totalRevenue.toFixed(2),
        totalCosts: totalCosts.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        grossMargin: grossMargin.toFixed(2),
        foodCostPercentage: foodCostPercentage.toFixed(2),
        sellingPrice: recipe.sellingPrice?.toString() || null,
        batchesProduced,
        batchesSold: totalQuantity,
      };
    })
  );

  return results;
}

export async function calculateCategoryProfitability(filters: ProfitabilityFilters) {
  const recipeResults = await calculateRecipeProfitability(filters);

  // Group by category
  const categoryMap = new Map<string, any>();

  for (const result of recipeResults) {
    const category = result.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        totalRevenue: new Decimal(0),
        totalCosts: new Decimal(0),
        recipeCount: 0,
      });
    }

    const categoryData = categoryMap.get(category);
    categoryData.totalRevenue = categoryData.totalRevenue.plus(
      new Decimal(result.totalRevenue)
    );
    categoryData.totalCosts = categoryData.totalCosts.plus(
      new Decimal(result.totalCosts)
    );
    categoryData.recipeCount += 1;
  }

  // Convert to array and calculate margins
  const results = Array.from(categoryMap.values()).map((data) => {
    const grossProfit = data.totalRevenue.minus(data.totalCosts);
    const grossMargin = data.totalRevenue.gt(0)
      ? grossProfit.dividedBy(data.totalRevenue).times(100)
      : new Decimal(0);
    const foodCostPercentage = data.totalRevenue.gt(0)
      ? data.totalCosts.dividedBy(data.totalRevenue).times(100)
      : new Decimal(0);

    return {
      category: data.category,
      totalRevenue: data.totalRevenue.toFixed(2),
      totalCosts: data.totalCosts.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      grossMargin: grossMargin.toFixed(2),
      foodCostPercentage: foodCostPercentage.toFixed(2),
      recipeCount: data.recipeCount,
    };
  });

  return results;
}

export async function getTopPerformingRecipes(
  companyId: number,
  limit: number,
  startDate?: Date,
  endDate?: Date
) {
  const results = await calculateRecipeProfitability({
    companyId,
    startDate,
    endDate,
  });

  // Sort by gross profit descending
  return results
    .sort((a, b) => parseFloat(b.grossProfit) - parseFloat(a.grossProfit))
    .slice(0, limit);
}

export async function getRecipesNeedingAttention(
  companyId: number,
  maxFoodCost: number,
  startDate?: Date,
  endDate?: Date
) {
  const results = await calculateRecipeProfitability({
    companyId,
    startDate,
    endDate,
  });

  // Filter recipes with food cost above threshold
  return results.filter(
    (r) => parseFloat(r.foodCostPercentage) > maxFoodCost
  );
}
