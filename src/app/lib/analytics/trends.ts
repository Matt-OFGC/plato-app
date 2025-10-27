import { Decimal } from "decimal.js";
import { prisma } from "@/lib/prisma";

export interface TrendData {
  period: string; // "daily", "weekly", "monthly"
  date: Date;
  value: Decimal;
  change: Decimal; // Change from previous period
  changePercentage: Decimal;
}

export interface SeasonalPattern {
  recipeId: number;
  recipeName: string;
  season: string;
  month: number;
  demandMultiplier: Decimal;
  confidence: Decimal;
  dataPoints: number;
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  data: TrendData[];
  trend: 'increasing' | 'decreasing' | 'stable';
  averageChange: Decimal;
  volatility: Decimal; // Standard deviation of changes
}

export interface TrendFilters {
  companyId: number;
  startDate: Date;
  endDate: Date;
  recipeIds?: number[];
  categories?: string[];
  period: 'daily' | 'weekly' | 'monthly';
}

/**
 * Analyze revenue trends
 */
export async function analyzeRevenueTrends(
  filters: TrendFilters
): Promise<TrendAnalysis> {
  const { companyId, startDate, endDate, period } = filters;
  
  // Get sales records
  const salesRecords = await prisma.salesRecord.findMany({
    where: {
      companyId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      transactionDate: true,
      totalRevenue: true,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });
  
  // Group by period
  const groupedData = groupDataByPeriod(salesRecords, period, 'totalRevenue');
  
  // Calculate trends
  const trendData = calculateTrendData(groupedData);
  
  return {
    metric: 'revenue',
    period,
    data: trendData,
    trend: calculateOverallTrend(trendData),
    averageChange: calculateAverageChange(trendData),
    volatility: calculateVolatility(trendData),
  };
}

/**
 * Analyze production trends
 */
export async function analyzeProductionTrends(
  filters: TrendFilters
): Promise<TrendAnalysis> {
  const { companyId, startDate, endDate, period, recipeIds } = filters;
  
  const productionWhere: any = {
    companyId,
    productionDate: {
      gte: startDate,
      lte: endDate,
    },
  };
  
  if (recipeIds && recipeIds.length > 0) {
    productionWhere.recipeId = { in: recipeIds };
  }
  
  const productionHistory = await prisma.productionHistory.findMany({
    where: productionWhere,
    select: {
      productionDate: true,
      quantityProduced: true,
    },
    orderBy: {
      productionDate: 'asc',
    },
  });
  
  // Group by period
  const groupedData = groupDataByPeriod(productionHistory, period, 'quantityProduced');
  
  // Calculate trends
  const trendData = calculateTrendData(groupedData);
  
  return {
    metric: 'production',
    period,
    data: trendData,
    trend: calculateOverallTrend(trendData),
    averageChange: calculateAverageChange(trendData),
    volatility: calculateVolatility(trendData),
  };
}

/**
 * Analyze ingredient cost trends
 */
export async function analyzeIngredientCostTrends(
  filters: TrendFilters
): Promise<TrendAnalysis> {
  const { companyId, startDate, endDate, period } = filters;
  
  const priceHistory = await prisma.ingredientPriceHistory.findMany({
    where: {
      ingredient: {
        companyId,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      price: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  
  // Group by period
  const groupedData = groupDataByPeriod(priceHistory, period, 'price');
  
  // Calculate trends
  const trendData = calculateTrendData(groupedData);
  
  return {
    metric: 'ingredient_costs',
    period,
    data: trendData,
    trend: calculateOverallTrend(trendData),
    averageChange: calculateAverageChange(trendData),
    volatility: calculateVolatility(trendData),
  };
}

/**
 * Detect seasonal patterns in sales
 */
export async function detectSeasonalPatterns(
  companyId: number,
  recipeIds?: number[]
): Promise<SeasonalPattern[]> {
  // Get sales records for the last 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  const salesWhere: any = {
    companyId,
    transactionDate: {
      gte: twoYearsAgo,
    },
  };
  
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
  
  // Group sales by recipe and month
  const recipeMonthSales = new Map<string, Map<number, Decimal>>();
  
  for (const sale of salesRecords) {
    if (!sale.recipeId) continue;
    
    const month = sale.transactionDate.getMonth() + 1; // 1-12
    const key = `${sale.recipeId}`;
    
    if (!recipeMonthSales.has(key)) {
      recipeMonthSales.set(key, new Map());
    }
    
    const monthSales = recipeMonthSales.get(key)!;
    const currentTotal = monthSales.get(month) || new Decimal(0);
    monthSales.set(month, currentTotal.add(sale.quantity));
  }
  
  // Calculate seasonal patterns
  const patterns: SeasonalPattern[] = [];
  
  for (const [recipeKey, monthSales] of recipeMonthSales) {
    const recipeId = parseInt(recipeKey);
    const recipe = salesRecords.find(s => s.recipeId === recipeId)?.recipe;
    
    if (!recipe) continue;
    
    // Calculate average monthly sales
    const monthlyTotals = Array.from(monthSales.values());
    const averageMonthly = monthlyTotals.reduce((sum, total) => sum.add(total), new Decimal(0))
      .div(monthlyTotals.length);
    
    // Find months with significant deviation
    for (const [month, total] of monthSales) {
      const multiplier = averageMonthly.gt(0) ? total.div(averageMonthly) : new Decimal(1);
      
      // Only consider significant deviations (>20% change)
      if (multiplier.gt(1.2) || multiplier.lt(0.8)) {
        const season = getSeasonFromMonth(month);
        const confidence = calculatePatternConfidence(monthlyTotals, total);
        
        patterns.push({
          recipeId,
          recipeName: recipe.name,
          season,
          month,
          demandMultiplier: multiplier,
          confidence,
          dataPoints: monthlyTotals.length,
        });
      }
    }
  }
  
  return patterns.sort((a, b) => b.confidence.toNumber() - a.confidence.toNumber());
}

/**
 * Compare year-over-year performance
 */
export async function compareYearOverYear(
  companyId: number,
  metric: 'revenue' | 'production' | 'costs',
  currentYear: number = new Date().getFullYear()
): Promise<{
  currentYear: TrendData[];
  previousYear: TrendData[];
  growthRate: Decimal;
  comparison: Array<{
    month: number;
    currentValue: Decimal;
    previousValue: Decimal;
    growth: Decimal;
    growthPercentage: Decimal;
  }>;
}> {
  const currentYearStart = new Date(currentYear, 0, 1);
  const currentYearEnd = new Date(currentYear, 11, 31);
  const previousYearStart = new Date(currentYear - 1, 0, 1);
  const previousYearEnd = new Date(currentYear - 1, 11, 31);
  
  let currentYearData: any[];
  let previousYearData: any[];
  
  if (metric === 'revenue') {
    currentYearData = await prisma.salesRecord.findMany({
      where: {
        companyId,
        transactionDate: {
          gte: currentYearStart,
          lte: currentYearEnd,
        },
      },
      select: {
        transactionDate: true,
        totalRevenue: true,
      },
    });
    
    previousYearData = await prisma.salesRecord.findMany({
      where: {
        companyId,
        transactionDate: {
          gte: previousYearStart,
          lte: previousYearEnd,
        },
      },
      select: {
        transactionDate: true,
        totalRevenue: true,
      },
    });
  } else if (metric === 'production') {
    currentYearData = await prisma.productionHistory.findMany({
      where: {
        companyId,
        productionDate: {
          gte: currentYearStart,
          lte: currentYearEnd,
        },
      },
      select: {
        productionDate: true,
        quantityProduced: true,
      },
    });
    
    previousYearData = await prisma.productionHistory.findMany({
      where: {
        companyId,
        productionDate: {
          gte: previousYearStart,
          lte: previousYearEnd,
        },
      },
      select: {
        productionDate: true,
        quantityProduced: true,
      },
    });
  } else {
    // costs
    currentYearData = await prisma.ingredientPriceHistory.findMany({
      where: {
        ingredient: {
          companyId,
        },
        createdAt: {
          gte: currentYearStart,
          lte: currentYearEnd,
        },
      },
      select: {
        createdAt: true,
        price: true,
      },
    });
    
    previousYearData = await prisma.ingredientPriceHistory.findMany({
      where: {
        ingredient: {
          companyId,
        },
        createdAt: {
          gte: previousYearStart,
          lte: previousYearEnd,
        },
      },
      select: {
        createdAt: true,
        price: true,
      },
    });
  }
  
  // Group by month
  const currentYearMonthly = groupDataByMonth(currentYearData, metric === 'revenue' ? 'totalRevenue' : metric === 'production' ? 'quantityProduced' : 'price');
  const previousYearMonthly = groupDataByMonth(previousYearData, metric === 'revenue' ? 'totalRevenue' : metric === 'production' ? 'quantityProduced' : 'price');
  
  // Calculate growth rate
  const currentYearTotal = currentYearMonthly.reduce((sum, item) => sum.add(item.value), new Decimal(0));
  const previousYearTotal = previousYearMonthly.reduce((sum, item) => sum.add(item.value), new Decimal(0));
  const growthRate = previousYearTotal.gt(0) ? currentYearTotal.sub(previousYearTotal).div(previousYearTotal) : new Decimal(0);
  
  // Create month-by-month comparison
  const comparison = [];
  for (let month = 1; month <= 12; month++) {
    const currentValue = currentYearMonthly.find(item => item.date.getMonth() + 1 === month)?.value || new Decimal(0);
    const previousValue = previousYearMonthly.find(item => item.date.getMonth() + 1 === month)?.value || new Decimal(0);
    const growth = currentValue.sub(previousValue);
    const growthPercentage = previousValue.gt(0) ? growth.div(previousValue) : new Decimal(0);
    
    comparison.push({
      month,
      currentValue,
      previousValue,
      growth,
      growthPercentage,
    });
  }
  
  return {
    currentYear: currentYearMonthly,
    previousYear: previousYearMonthly,
    growthRate,
    comparison,
  };
}

/**
 * Group data by period
 */
function groupDataByPeriod(
  data: Array<{ [key: string]: any; transactionDate?: Date; productionDate?: Date; createdAt?: Date }>,
  period: 'daily' | 'weekly' | 'monthly',
  valueField: string
): Array<{ date: Date; value: Decimal }> {
  const grouped = new Map<string, Decimal>();
  
  for (const item of data) {
    const date = item.transactionDate || item.productionDate || item.createdAt;
    if (!date) continue;
    
    let key: string;
    
    if (period === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const currentValue = grouped.get(key) || new Decimal(0);
    grouped.set(key, currentValue.add(item[valueField]));
  }
  
  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      date: new Date(key),
      value,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Group data by month
 */
function groupDataByMonth(
  data: Array<{ [key: string]: any; transactionDate?: Date; productionDate?: Date; createdAt?: Date }>,
  valueField: string
): Array<{ date: Date; value: Decimal }> {
  const grouped = new Map<string, Decimal>();
  
  for (const item of data) {
    const date = item.transactionDate || item.productionDate || item.createdAt;
    if (!date) continue;
    
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const currentValue = grouped.get(key) || new Decimal(0);
    grouped.set(key, currentValue.add(item[valueField]));
  }
  
  return Array.from(grouped.entries())
    .map(([key, value]) => ({
      date: new Date(key + '-01'),
      value,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate trend data with changes
 */
function calculateTrendData(data: Array<{ date: Date; value: Decimal }>): TrendData[] {
  const trendData: TrendData[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const previous = i > 0 ? data[i - 1] : null;
    
    const change = previous ? current.value.sub(previous.value) : new Decimal(0);
    const changePercentage = previous && previous.value.gt(0) 
      ? change.div(previous.value).mul(100)
      : new Decimal(0);
    
    trendData.push({
      period: current.date.toISOString().split('T')[0],
      date: current.date,
      value: current.value,
      change,
      changePercentage,
    });
  }
  
  return trendData;
}

/**
 * Calculate overall trend direction
 */
function calculateOverallTrend(data: TrendData[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) return 'stable';
  
  const changes = data.slice(1).map(item => item.changePercentage.toNumber());
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  if (avgChange > 5) return 'increasing';
  if (avgChange < -5) return 'decreasing';
  return 'stable';
}

/**
 * Calculate average change
 */
function calculateAverageChange(data: TrendData[]): Decimal {
  if (data.length < 2) return new Decimal(0);
  
  const changes = data.slice(1).map(item => item.changePercentage);
  return changes.reduce((sum, change) => sum.add(change), new Decimal(0))
    .div(changes.length);
}

/**
 * Calculate volatility (standard deviation of changes)
 */
function calculateVolatility(data: TrendData[]): Decimal {
  if (data.length < 2) return new Decimal(0);
  
  const changes = data.slice(1).map(item => item.changePercentage.toNumber());
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
  
  const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;
  return new Decimal(Math.sqrt(variance));
}

/**
 * Get season from month
 */
function getSeasonFromMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Calculate pattern confidence
 */
function calculatePatternConfidence(monthlyTotals: Decimal[], currentTotal: Decimal): Decimal {
  // Simple confidence calculation based on consistency
  const avg = monthlyTotals.reduce((sum, total) => sum.add(total), new Decimal(0))
    .div(monthlyTotals.length);
  
  const variance = monthlyTotals.reduce((sum, total) => {
    const diff = total.sub(avg);
    return sum.add(diff.mul(diff));
  }, new Decimal(0)).div(monthlyTotals.length);
  
  const standardDeviation = variance.sqrt();
  const coefficientOfVariation = avg.gt(0) ? standardDeviation.div(avg) : new Decimal(0);
  
  // Lower coefficient of variation = higher confidence
  return new Decimal(Math.max(0, Math.min(1, 1 - coefficientOfVariation.toNumber())));
}
