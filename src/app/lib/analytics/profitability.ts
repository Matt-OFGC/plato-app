import { Decimal } from "decimal.js";
import { prisma } from "@/lib/prisma";

export interface ProfitabilityMetrics {
  recipeId: number;
  recipeName: string;
  category: string | null;
  totalRevenue: Decimal;
  totalCosts: Decimal;
  grossProfit: Decimal;
  grossMargin: Decimal; // Percentage
  foodCostPercentage: Decimal;
  sellingPrice: Decimal | null;
  calculatedCost: Decimal;
  batchesProduced: number;
  avgBatchSize: Decimal;
}

export interface CategoryProfitability {
  category: string;
  totalRevenue: Decimal;
  totalCosts: Decimal;
  grossProfit: Decimal;
  grossMargin: Decimal;
  recipeCount: number;
  avgFoodCost: Decimal;
}

export interface ProfitabilityFilters {
  companyId: number;
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  recipeIds?: number[];
}

/**
 * Calculate profitability metrics for recipes
 */
export async function calculateRecipeProfitability(
  filters: ProfitabilityFilters
): Promise<ProfitabilityMetrics[]> {
  const { companyId, startDate, endDate, categoryId, recipeIds } = filters;

  // Build where clause
  const whereClause: any = {
    companyId,
  };

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (recipeIds && recipeIds.length > 0) {
    whereClause.id = { in: recipeIds };
  }

  // Get recipes with their items and ingredients
  const recipes = await prisma.recipe.findMany({
    where: whereClause,
    include: {
      items: {
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              packQuantity: true,
              packUnit: true,
              packPrice: true,
              currency: true,
              densityGPerMl: true,
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
                  id: true,
                  name: true,
                  packQuantity: true,
                  packUnit: true,
                  packPrice: true,
                  currency: true,
                  densityGPerMl: true,
                },
              },
            },
          },
        },
      },
      categoryRef: {
        select: {
          name: true,
        },
      },
    },
  });

  // Get sales records for revenue calculation
  const salesWhere: any = {
    companyId,
    recipeId: { in: recipes.map(r => r.id) },
  };

  if (startDate && endDate) {
    salesWhere.transactionDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const salesRecords = await prisma.salesRecord.findMany({
    where: salesWhere,
    select: {
      recipeId: true,
      totalRevenue: true,
      quantity: true,
    },
  });

  // Get production history for batch counts
  const productionWhere: any = {
    companyId,
    recipeId: { in: recipes.map(r => r.id) },
  };

  if (startDate && endDate) {
    productionWhere.productionDate = {
      gte: startDate,
      lte: endDate,
    };
  }

  const productionHistory = await prisma.productionHistory.findMany({
    where: productionWhere,
    select: {
      recipeId: true,
      quantityProduced: true,
    },
  });

  // Calculate metrics for each recipe
  const metrics: ProfitabilityMetrics[] = [];

  for (const recipe of recipes) {
    // Calculate recipe cost
    const allItems = [
      ...recipe.items.map(item => ({
        quantity: Number(item.quantity),
        unit: item.unit,
        ingredient: {
          packQuantity: Number(item.ingredient.packQuantity),
          packUnit: item.ingredient.packUnit,
          packPrice: Number(item.ingredient.packPrice),
          densityGPerMl: item.ingredient.densityGPerMl ? Number(item.ingredient.densityGPerMl) : undefined,
        },
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
          },
        }))
      ),
    ];

    const calculatedCost = calculateRecipeCost(allItems);
    
    // Calculate revenue from sales records
    const recipeSales = salesRecords.filter(s => s.recipeId === recipe.id);
    const totalRevenue = recipeSales.reduce((sum, sale) => sum.add(sale.totalRevenue), new Decimal(0));
    
    // Calculate production metrics
    const recipeProduction = productionHistory.filter(p => p.recipeId === recipe.id);
    const batchesProduced = recipeProduction.length;
    const totalQuantityProduced = recipeProduction.reduce((sum, prod) => sum.add(prod.quantityProduced), new Decimal(0));
    const avgBatchSize = batchesProduced > 0 ? totalQuantityProduced.div(batchesProduced) : new Decimal(0);
    
    // Calculate total costs (cost per batch * batches produced)
    const totalCosts = calculatedCost.mul(batchesProduced);
    
    // Calculate gross profit and margin
    const grossProfit = totalRevenue.sub(totalCosts);
    const grossMargin = totalRevenue.gt(0) ? grossProfit.div(totalRevenue).mul(100) : new Decimal(0);
    
    // Calculate food cost percentage
    const foodCostPercentage = recipe.sellingPrice && recipe.sellingPrice.gt(0) 
      ? calculatedCost.div(recipe.sellingPrice).mul(100)
      : new Decimal(0);

    metrics.push({
      recipeId: recipe.id,
      recipeName: recipe.name,
      category: recipe.categoryRef?.name || recipe.category || null,
      totalRevenue,
      totalCosts,
      grossProfit,
      grossMargin,
      foodCostPercentage,
      sellingPrice: recipe.sellingPrice,
      calculatedCost,
      batchesProduced,
      avgBatchSize,
    });
  }

  return metrics;
}

/**
 * Calculate profitability by category
 */
export async function calculateCategoryProfitability(
  filters: ProfitabilityFilters
): Promise<CategoryProfitability[]> {
  const recipeMetrics = await calculateRecipeProfitability(filters);
  
  // Group by category
  const categoryMap = new Map<string, {
    totalRevenue: Decimal;
    totalCosts: Decimal;
    recipeCount: number;
    foodCostSum: Decimal;
  }>();

  for (const metric of recipeMetrics) {
    const category = metric.category || "Uncategorized";
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        totalRevenue: new Decimal(0),
        totalCosts: new Decimal(0),
        recipeCount: 0,
        foodCostSum: new Decimal(0),
      });
    }

    const categoryData = categoryMap.get(category)!;
    categoryData.totalRevenue = categoryData.totalRevenue.add(metric.totalRevenue);
    categoryData.totalCosts = categoryData.totalCosts.add(metric.totalCosts);
    categoryData.recipeCount += 1;
    categoryData.foodCostSum = categoryData.foodCostSum.add(metric.foodCostPercentage);
  }

  // Convert to array and calculate final metrics
  const categoryMetrics: CategoryProfitability[] = [];

  for (const [category, data] of categoryMap) {
    const grossProfit = data.totalRevenue.sub(data.totalCosts);
    const grossMargin = data.totalRevenue.gt(0) ? grossProfit.div(data.totalRevenue).mul(100) : new Decimal(0);
    const avgFoodCost = data.recipeCount > 0 ? data.foodCostSum.div(data.recipeCount) : new Decimal(0);

    categoryMetrics.push({
      category,
      totalRevenue: data.totalRevenue,
      totalCosts: data.totalCosts,
      grossProfit,
      grossMargin,
      recipeCount: data.recipeCount,
      avgFoodCost,
    });
  }

  return categoryMetrics.sort((a, b) => b.grossMargin.toNumber() - a.grossMargin.toNumber());
}

/**
 * Calculate recipe cost from items
 */
function calculateRecipeCost(items: Array<{
  quantity: number;
  unit: string;
  ingredient: {
    packQuantity: number;
    packUnit: string;
    packPrice: number;
    densityGPerMl?: number;
  };
}>): Decimal {
  let totalCost = new Decimal(0);

  for (const item of items) {
    const { quantity, unit, ingredient } = item;
    
    // Convert quantity to base unit (g, ml, each)
    const baseQuantity = convertToBaseUnit(quantity, unit, ingredient);
    
    // Calculate cost per base unit
    const costPerBaseUnit = new Decimal(ingredient.packPrice).div(ingredient.packQuantity);
    
    // Calculate total cost for this item
    const itemCost = baseQuantity.mul(costPerBaseUnit);
    totalCost = totalCost.add(itemCost);
  }

  return totalCost;
}

/**
 * Convert quantity to base unit
 */
function convertToBaseUnit(
  quantity: number,
  unit: string,
  ingredient: { packUnit: string; densityGPerMl?: number }
): Decimal {
  const qty = new Decimal(quantity);
  
  // If already in base unit, return as is
  if (unit === ingredient.packUnit) {
    return qty;
  }

  // Conversion factors (simplified - you might want to use the existing units library)
  const conversions: Record<string, Record<string, number>> = {
    g: { kg: 1000, mg: 0.001, lb: 453.592, oz: 28.3495 },
    ml: { l: 1000, tsp: 5, tbsp: 15, cup: 240, floz: 29.5735 },
    each: { slices: 1 }, // Assuming 1 each = 1 slice for simplicity
  };

  const baseUnit = ingredient.packUnit as keyof typeof conversions;
  const conversionFactor = conversions[baseUnit]?.[unit];

  if (conversionFactor) {
    return qty.mul(conversionFactor);
  }

  // If density is available, use it for volume to mass conversion
  if (ingredient.densityGPerMl && (unit.includes('ml') || unit.includes('l')) && baseUnit === 'g') {
    const volumeInMl = unit === 'l' ? qty.mul(1000) : qty;
    return volumeInMl.mul(ingredient.densityGPerMl);
  }

  // Default: assume 1:1 conversion if no specific conversion found
  return qty;
}

/**
 * Get top performing recipes by profitability
 */
export async function getTopPerformingRecipes(
  companyId: number,
  limit: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<ProfitabilityMetrics[]> {
  const metrics = await calculateRecipeProfitability({
    companyId,
    startDate,
    endDate,
  });

  return metrics
    .filter(m => m.totalRevenue.gt(0))
    .sort((a, b) => b.grossMargin.toNumber() - a.grossMargin.toNumber())
    .slice(0, limit);
}

/**
 * Get recipes that need attention (high food cost)
 */
export async function getRecipesNeedingAttention(
  companyId: number,
  maxFoodCost: number = 35,
  startDate?: Date,
  endDate?: Date
): Promise<ProfitabilityMetrics[]> {
  const metrics = await calculateRecipeProfitability({
    companyId,
    startDate,
    endDate,
  });

  return metrics
    .filter(m => m.foodCostPercentage.gt(maxFoodCost))
    .sort((a, b) => b.foodCostPercentage.toNumber() - a.foodCostPercentage.toNumber());
}
