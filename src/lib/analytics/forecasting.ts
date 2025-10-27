import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

interface ForecastingFilters {
  companyId: number;
  startDate?: Date;
  endDate?: Date;
  recipeIds?: number[];
  ingredientIds?: number[];
}

interface ForecastResult {
  period: string;
  forecastedValue: string;
  confidence: string;
  historicalAverage: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export async function forecastIngredientUsage(filters: ForecastingFilters) {
  const { companyId, startDate, endDate, ingredientIds } = filters;

  // Get historical production data
  const productionHistory = await prisma.productionHistory.findMany({
    where: {
      companyId,
      ...(startDate && endDate && {
        productionDate: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    include: {
      recipe: {
        include: {
          ingredients: {
            where: ingredientIds && ingredientIds.length > 0
              ? { ingredientId: { in: ingredientIds } }
              : undefined,
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Calculate usage per ingredient
  const ingredientUsage = new Map<number, { name: string; unit: string; quantities: number[] }>();

  for (const production of productionHistory) {
    for (const ingredient of production.recipe.ingredients) {
      if (!ingredientUsage.has(ingredient.ingredientId)) {
        ingredientUsage.set(ingredient.ingredientId, {
          name: ingredient.ingredient.name,
          unit: ingredient.ingredient.unit,
          quantities: [],
        });
      }

      const usage = ingredientUsage.get(ingredient.ingredientId)!;
      const quantity = Number(ingredient.quantity) * Number(production.quantityProduced) / Number(production.recipe.yieldQuantity);
      usage.quantities.push(quantity);
    }
  }

  // Generate forecasts
  const forecasts = Array.from(ingredientUsage.entries()).map(([ingredientId, data]) => {
    const avgUsage = calculateAverage(data.quantities);
    const trend = calculateTrend(data.quantities);
    const forecastedValue = calculateForecast(data.quantities, trend);

    return {
      ingredientId,
      ingredientName: data.name,
      unit: data.unit,
      forecastedUsage: forecastedValue.toFixed(2),
      averageUsage: avgUsage.toFixed(2),
      trend,
      confidence: calculateConfidence(data.quantities).toFixed(0),
    };
  });

  return forecasts;
}

export async function forecastSales(filters: ForecastingFilters) {
  const { companyId, startDate, endDate, recipeIds } = filters;

  // Get historical sales data
  const salesRecords = await prisma.salesRecord.findMany({
    where: {
      companyId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
      ...(recipeIds && recipeIds.length > 0 && { recipeId: { in: recipeIds } }),
    },
    select: {
      recipeId: true,
      date: true,
      quantity: true,
      price: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Group by recipe and week
  const weeklySales = new Map<number, Map<string, number>>();

  for (const sale of salesRecords) {
    if (!weeklySales.has(sale.recipeId)) {
      weeklySales.set(sale.recipeId, new Map());
    }

    const weekKey = getWeekKey(sale.date);
    const weekSales = weeklySales.get(sale.recipeId)!;
    const currentTotal = weekSales.get(weekKey) || 0;
    weekSales.set(weekKey, currentTotal + sale.quantity);
  }

  // Get recipe names
  const recipes = await prisma.recipe.findMany({
    where: {
      companyId,
      ...(recipeIds && recipeIds.length > 0 && { id: { in: recipeIds } }),
    },
    select: {
      id: true,
      name: true,
    },
  });

  const recipeMap = new Map(recipes.map(r => [r.id, r.name]));

  // Generate forecasts
  const forecasts = Array.from(weeklySales.entries()).map(([recipeId, weeklyData]) => {
    const weeklyValues = Array.from(weeklyData.values());
    const avgSales = calculateAverage(weeklyValues);
    const trend = calculateTrend(weeklyValues);
    const forecastedSales = calculateForecast(weeklyValues, trend);

    return {
      recipeId,
      recipeName: recipeMap.get(recipeId) || 'Unknown',
      forecastedQuantity: forecastedSales.toFixed(2),
      averageQuantity: avgSales.toFixed(2),
      trend,
      confidence: calculateConfidence(weeklyValues).toFixed(0),
      historicalWeeks: weeklyData.size,
    };
  });

  return forecasts;
}

export async function generateReorderSuggestions(
  companyId: number,
  maxDays: number
) {
  // Get current inventory levels
  const inventory = await prisma.inventoryItem.findMany({
    where: { companyId },
    include: {
      ingredient: {
        select: {
          id: true,
          name: true,
          unit: true,
          reorderPoint: true,
          reorderQuantity: true,
        },
      },
    },
  });

  // Get recent usage rates
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentProduction = await prisma.productionHistory.findMany({
    where: {
      companyId,
      productionDate: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      recipe: {
        include: {
          ingredients: true,
        },
      },
    },
  });

  // Calculate usage rates
  const ingredientUsage = new Map<number, number>();

  for (const production of recentProduction) {
    for (const ingredient of production.recipe.ingredients) {
      const quantity = Number(ingredient.quantity) * Number(production.quantityProduced) / Number(production.recipe.yieldQuantity);
      const currentUsage = ingredientUsage.get(ingredient.ingredientId) || 0;
      ingredientUsage.set(ingredient.ingredientId, currentUsage + quantity);
    }
  }

  // Calculate daily usage rate
  const days = 30;
  const dailyUsage = new Map<number, number>();
  for (const [ingredientId, totalUsage] of ingredientUsage.entries()) {
    dailyUsage.set(ingredientId, totalUsage / days);
  }

  // Generate suggestions
  const suggestions = inventory
    .filter(item => {
      const currentStock = Number(item.quantity);
      const dailyRate = dailyUsage.get(item.ingredientId) || 0;
      const daysUntilEmpty = dailyRate > 0 ? currentStock / dailyRate : 999;
      return daysUntilEmpty < maxDays || currentStock <= Number(item.ingredient.reorderPoint);
    })
    .map(item => {
      const currentStock = Number(item.quantity);
      const dailyRate = dailyUsage.get(item.ingredientId) || 0;
      const daysUntilEmpty = dailyRate > 0 ? currentStock / dailyRate : 999;
      const suggestedReorder = item.ingredient.reorderQuantity 
        ? Number(item.ingredient.reorderQuantity)
        : Math.max(dailyRate * maxDays * 2, currentStock);

      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        unit: item.ingredient.unit,
        currentStock: currentStock.toFixed(2),
        dailyUsage: dailyRate.toFixed(2),
        daysUntilEmpty: daysUntilEmpty.toFixed(1),
        suggestedReorder: suggestedReorder.toFixed(2),
        urgent: daysUntilEmpty < maxDays / 2,
      };
    })
    .sort((a, b) => parseFloat(a.daysUntilEmpty) - parseFloat(b.daysUntilEmpty));

  return suggestions;
}

// Helper functions
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';
  
  // Simple linear regression slope
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < values.length; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const n = values.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope > 0.1) return 'increasing';
  if (slope < -0.1) return 'decreasing';
  return 'stable';
}

function calculateForecast(values: number[], trend: string): number {
  if (values.length === 0) return 0;
  
  const avg = calculateAverage(values);
  const recentValues = values.slice(-Math.min(7, values.length));
  const recentAvg = calculateAverage(recentValues);
  
  // Apply trend adjustment
  if (trend === 'increasing') {
    return recentAvg * 1.1;
  } else if (trend === 'decreasing') {
    return recentAvg * 0.9;
  }
  
  return avg;
}

function calculateConfidence(values: number[]): number {
  if (values.length < 2) return 0;
  
  // Calculate coefficient of variation
  const avg = calculateAverage(values);
  if (avg === 0) return 100;
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;
  
  // Convert to confidence (lower variation = higher confidence)
  const confidence = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  
  return confidence;
}

function getWeekKey(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const diff = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return `${year}-W${String(diff + 1).padStart(2, '0')}`;
}
