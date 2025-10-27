import { Decimal } from "decimal.js";
import { prisma } from "@/lib/prisma";

export interface ForecastData {
  date: Date;
  predictedValue: Decimal;
  confidence: number; // 0-1
  lowerBound: Decimal;
  upperBound: Decimal;
}

export interface IngredientForecast {
  ingredientId: number;
  ingredientName: string;
  currentStock: Decimal;
  predictedUsage: Decimal;
  reorderPoint: Decimal;
  suggestedOrderQuantity: Decimal;
  daysUntilReorder: number;
  confidence: number;
}

export interface SalesForecast {
  recipeId: number;
  recipeName: string;
  predictedSales: Decimal;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonalMultiplier: Decimal;
}

export interface ForecastingFilters {
  companyId: number;
  startDate?: Date;
  endDate?: Date;
  recipeIds?: number[];
  ingredientIds?: number[];
}

/**
 * Calculate moving average forecast
 */
export function calculateMovingAverage(
  data: Array<{ date: Date; value: Decimal }>,
  period: number = 7
): ForecastData[] {
  if (data.length < period) {
    return [];
  }

  const forecasts: ForecastData[] = [];
  
  for (let i = period; i < data.length; i++) {
    const window = data.slice(i - period, i);
    const average = window.reduce((sum, item) => sum.add(item.value), new Decimal(0))
      .div(period);
    
    // Calculate confidence based on variance
    const variance = window.reduce((sum, item) => {
      const diff = item.value.sub(average);
      return sum.add(diff.mul(diff));
    }, new Decimal(0)).div(period);
    
    const standardDeviation = variance.sqrt();
    const confidence = Math.max(0, Math.min(1, 1 - standardDeviation.div(average).toNumber()));
    
    // Calculate bounds (assuming normal distribution)
    const margin = standardDeviation.mul(1.96); // 95% confidence interval
    const lowerBound = average.sub(margin);
    const upperBound = average.add(margin);
    
    forecasts.push({
      date: data[i].date,
      predictedValue: average,
      confidence,
      lowerBound: lowerBound.gt(0) ? lowerBound : new Decimal(0),
      upperBound,
    });
  }
  
  return forecasts;
}

/**
 * Calculate exponential smoothing forecast
 */
export function calculateExponentialSmoothing(
  data: Array<{ date: Date; value: Decimal }>,
  alpha: number = 0.3
): ForecastData[] {
  if (data.length < 2) {
    return [];
  }

  const forecasts: ForecastData[] = [];
  let smoothed = data[0].value;
  
  for (let i = 1; i < data.length; i++) {
    smoothed = data[i].value.mul(alpha).add(smoothed.mul(1 - alpha));
    
    // Calculate confidence based on recent error
    const error = data[i].value.sub(smoothed).abs();
    const confidence = Math.max(0, Math.min(1, 1 - error.div(data[i].value).toNumber()));
    
    // Simple bounds calculation
    const margin = error.mul(2);
    const lowerBound = smoothed.sub(margin);
    const upperBound = smoothed.add(margin);
    
    forecasts.push({
      date: data[i].date,
      predictedValue: smoothed,
      confidence,
      lowerBound: lowerBound.gt(0) ? lowerBound : new Decimal(0),
      upperBound,
    });
  }
  
  return forecasts;
}

/**
 * Forecast ingredient usage based on production history
 */
export async function forecastIngredientUsage(
  filters: ForecastingFilters
): Promise<IngredientForecast[]> {
  const { companyId, startDate, endDate, ingredientIds } = filters;
  
  // Get production history for the specified period
  const productionWhere: any = {
    companyId,
  };
  
  if (startDate && endDate) {
    productionWhere.productionDate = {
      gte: startDate,
      lte: endDate,
    };
  }
  
  const productionHistory = await prisma.productionHistory.findMany({
    where: productionWhere,
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
  });
  
  // Get current inventory levels
  const inventory = await prisma.inventory.findMany({
    where: {
      companyId,
      ...(ingredientIds && { recipeId: { in: ingredientIds } }),
    },
    include: {
      recipe: true,
    },
  });
  
  // Calculate ingredient usage from production
  const ingredientUsage = new Map<number, Array<{ date: Date; usage: Decimal }>>();
  
  for (const production of productionHistory) {
    const recipe = production.recipe;
    const allItems = [
      ...recipe.items.map(item => ({
        ingredientId: item.ingredient.id,
        quantity: Number(item.quantity),
        unit: item.unit,
        ingredient: item.ingredient,
      })),
      ...recipe.sections.flatMap(section => 
        section.items.map(item => ({
          ingredientId: item.ingredient.id,
          quantity: Number(item.quantity),
          unit: item.unit,
          ingredient: item.ingredient,
        }))
      ),
    ];
    
    for (const item of allItems) {
      if (ingredientIds && !ingredientIds.includes(item.ingredientId)) {
        continue;
      }
      
      // Calculate usage for this production batch
      const usagePerBatch = calculateIngredientUsagePerBatch(item, production.quantityProduced);
      
      if (!ingredientUsage.has(item.ingredientId)) {
        ingredientUsage.set(item.ingredientId, []);
      }
      
      ingredientUsage.get(item.ingredientId)!.push({
        date: production.productionDate,
        usage: usagePerBatch,
      });
    }
  }
  
  // Generate forecasts for each ingredient
  const forecasts: IngredientForecast[] = [];
  
  for (const [ingredientId, usageData] of ingredientUsage) {
    if (usageData.length < 3) {
      continue; // Need at least 3 data points for forecasting
    }
    
    // Sort by date
    usageData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate moving average forecast
    const forecastData = calculateMovingAverage(usageData, Math.min(7, usageData.length));
    
    if (forecastData.length === 0) {
      continue;
    }
    
    // Get latest forecast
    const latestForecast = forecastData[forecastData.length - 1];
    
    // Get current stock
    const currentStock = inventory.find(inv => inv.recipeId === ingredientId)?.quantity || new Decimal(0);
    
    // Calculate reorder point (usage rate * lead time + safety stock)
    const avgUsage = usageData.reduce((sum, item) => sum.add(item.usage), new Decimal(0))
      .div(usageData.length);
    const leadTime = 7; // Assume 7 days lead time
    const safetyStock = avgUsage.mul(2); // 2 days safety stock
    const reorderPoint = avgUsage.mul(leadTime).add(safetyStock);
    
    // Calculate suggested order quantity
    const suggestedOrderQuantity = avgUsage.mul(14); // Order for 2 weeks
    
    // Calculate days until reorder
    const daysUntilReorder = currentStock.gt(0) && avgUsage.gt(0) 
      ? Math.ceil(currentStock.div(avgUsage).toNumber())
      : 0;
    
    // Get ingredient name
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { name: true },
    });
    
    forecasts.push({
      ingredientId,
      ingredientName: ingredient?.name || `Ingredient ${ingredientId}`,
      currentStock,
      predictedUsage: latestForecast.predictedValue,
      reorderPoint,
      suggestedOrderQuantity,
      daysUntilReorder,
      confidence: latestForecast.confidence,
    });
  }
  
  return forecasts.sort((a, b) => a.daysUntilReorder - b.daysUntilReorder);
}

/**
 * Forecast sales based on historical sales data
 */
export async function forecastSales(
  filters: ForecastingFilters
): Promise<SalesForecast[]> {
  const { companyId, startDate, endDate, recipeIds } = filters;
  
  // Get sales records
  const salesWhere: any = {
    companyId,
  };
  
  if (startDate && endDate) {
    salesWhere.transactionDate = {
      gte: startDate,
      lte: endDate,
    };
  }
  
  if (recipeIds && recipeIds.length > 0) {
    salesWhere.recipeId = { in: recipeIds };
  }
  
  const salesRecords = await prisma.salesRecord.findMany({
    where: salesWhere,
    include: {
      recipe: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  // Group sales by recipe
  const recipeSales = new Map<number, Array<{ date: Date; quantity: Decimal }>>();
  
  for (const sale of salesRecords) {
    if (!sale.recipeId) continue;
    
    if (!recipeSales.has(sale.recipeId)) {
      recipeSales.set(sale.recipeId, []);
    }
    
    recipeSales.get(sale.recipeId)!.push({
      date: sale.transactionDate,
      quantity: sale.quantity,
    });
  }
  
  // Generate forecasts for each recipe
  const forecasts: SalesForecast[] = [];
  
  for (const [recipeId, salesData] of recipeSales) {
    if (salesData.length < 3) {
      continue; // Need at least 3 data points for forecasting
    }
    
    // Sort by date
    salesData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate exponential smoothing forecast
    const forecastData = calculateExponentialSmoothing(salesData);
    
    if (forecastData.length === 0) {
      continue;
    }
    
    // Get latest forecast
    const latestForecast = forecastData[forecastData.length - 1];
    
    // Calculate trend
    const recentData = salesData.slice(-7); // Last 7 data points
    const trend = calculateTrend(recentData);
    
    // Get seasonal multiplier
    const seasonalMultiplier = await getSeasonalMultiplier(companyId, recipeId);
    
    // Apply seasonal adjustment
    const adjustedPrediction = latestForecast.predictedValue.mul(seasonalMultiplier);
    
    // Get recipe name
    const recipe = salesRecords.find(s => s.recipeId === recipeId)?.recipe;
    
    forecasts.push({
      recipeId,
      recipeName: recipe?.name || `Recipe ${recipeId}`,
      predictedSales: adjustedPrediction,
      confidence: latestForecast.confidence,
      trend,
      seasonalMultiplier,
    });
  }
  
  return forecasts.sort((a, b) => b.predictedSales.toNumber() - a.predictedSales.toNumber());
}

/**
 * Calculate ingredient usage per batch
 */
function calculateIngredientUsagePerBatch(
  item: {
    ingredientId: number;
    quantity: number;
    unit: string;
    ingredient: any;
  },
  batchQuantity: Decimal
): Decimal {
  // Convert item quantity to base unit
  const itemQuantity = new Decimal(item.quantity);
  
  // Calculate usage per batch
  return itemQuantity.mul(batchQuantity);
}

/**
 * Calculate trend from recent data
 */
function calculateTrend(data: Array<{ date: Date; quantity: Decimal }>): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) {
    return 'stable';
  }
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, item) => sum.add(item.quantity), new Decimal(0))
    .div(firstHalf.length);
  const secondAvg = secondHalf.reduce((sum, item) => sum.add(item.quantity), new Decimal(0))
    .div(secondHalf.length);
  
  const change = secondAvg.sub(firstAvg).div(firstAvg);
  
  if (change.gt(0.1)) {
    return 'increasing';
  } else if (change.lt(-0.1)) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Get seasonal multiplier for a recipe
 */
async function getSeasonalMultiplier(companyId: number, recipeId: number): Promise<Decimal> {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const seasonalTrend = await prisma.seasonalTrend.findFirst({
    where: {
      companyId,
      recipeId,
      month: currentMonth,
      isActive: true,
    },
  });
  
  if (seasonalTrend) {
    return seasonalTrend.demandMultiplier;
  }
  
  // Default multiplier if no seasonal trend found
  return new Decimal(1);
}

/**
 * Generate reorder suggestions
 */
export async function generateReorderSuggestions(
  companyId: number,
  maxDaysUntilReorder: number = 7
): Promise<IngredientForecast[]> {
  const forecasts = await forecastIngredientUsage({
    companyId,
  });
  
  return forecasts.filter(forecast => forecast.daysUntilReorder <= maxDaysUntilReorder);
}
