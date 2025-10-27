import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

interface TrendFilters {
  companyId: number;
  startDate: Date;
  endDate: Date;
  recipeIds?: number[];
  categories?: string[];
  period: 'daily' | 'weekly' | 'monthly';
}

export async function analyzeRevenueTrends(filters: TrendFilters) {
  const { companyId, startDate, endDate, recipeIds, period } = filters;

  // Get sales records in the date range
  const salesRecords = await prisma.salesRecord.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(recipeIds && recipeIds.length > 0 && { recipeId: { in: recipeIds } }),
    },
    select: {
      date: true,
      price: true,
      quantity: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Group by period
  const grouped = groupByPeriod(salesRecords, period, (record) => ({
    revenue: new Decimal(record.price).times(record.quantity),
    quantity: record.quantity,
  }));

  // Calculate trends
  const data = Array.from(grouped.entries()).map(([period, records]) => {
    const totalRevenue = records.reduce(
      (sum, r) => sum.plus(r.revenue),
      new Decimal(0)
    );
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);

    return {
      period,
      revenue: totalRevenue.toFixed(2),
      quantity: totalQuantity,
      avgPrice: totalQuantity > 0 ? totalRevenue.dividedBy(totalQuantity).toFixed(2) : '0',
    };
  });

  // Calculate growth rate
  const growthRate = calculateGrowthRate(data.map(d => parseFloat(d.revenue)));

  return {
    data,
    growthRate: growthRate.toFixed(2),
    summary: {
      totalRevenue: data.reduce((sum, d) => sum + parseFloat(d.revenue), 0).toFixed(2),
      totalQuantity: data.reduce((sum, d) => sum + d.quantity, 0),
      avgRevenue: calculateAverage(data.map(d => parseFloat(d.revenue))).toFixed(2),
    },
  };
}

export async function analyzeProductionTrends(filters: TrendFilters) {
  const { companyId, startDate, endDate, recipeIds, period } = filters;

  const productionHistory = await prisma.productionHistory.findMany({
    where: {
      companyId,
      productionDate: {
        gte: startDate,
        lte: endDate,
      },
      ...(recipeIds && recipeIds.length > 0 && { recipeId: { in: recipeIds } }),
    },
    select: {
      productionDate: true,
      quantityProduced: true,
    },
    orderBy: {
      productionDate: 'asc',
    },
  });

  const grouped = groupByPeriod(
    productionHistory,
    period,
    (record) => ({ quantity: Number(record.quantityProduced) })
  );

  const data = Array.from(grouped.entries()).map(([period, records]) => {
    const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
    return {
      period,
      quantity: totalQuantity,
    };
  });

  return {
    data,
    summary: {
      totalQuantity: data.reduce((sum, d) => sum + d.quantity, 0),
      avgQuantity: calculateAverage(data.map(d => d.quantity)).toFixed(2),
    },
  };
}

export async function analyzeIngredientCostTrends(filters: TrendFilters) {
  const { companyId, startDate, endDate } = filters;

  const priceHistory = await prisma.ingredientPriceHistory.findMany({
    where: {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      price: true,
      ingredientId: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  const grouped = groupByPeriod(priceHistory, 'monthly', (record) => ({
    price: new Decimal(record.price),
  }));

  const data = Array.from(grouped.entries()).map(([period, records]) => {
    const avgPrice = records.reduce((sum, r) => sum.plus(r.price), new Decimal(0))
      .dividedBy(records.length);
    
    return {
      period,
      avgPrice: avgPrice.toFixed(2),
      priceChange: calculatePriceChange(records),
    };
  });

  return {
    data,
    summary: {
      overallChange: calculateOverallChange(data),
    },
  };
}

export async function detectSeasonalPatterns(
  companyId: number,
  recipeIds?: number[]
) {
  // Get sales data for the past 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const salesRecords = await prisma.salesRecord.findMany({
    where: {
      companyId,
      date: {
        gte: twoYearsAgo,
      },
      ...(recipeIds && recipeIds.length > 0 && { recipeId: { in: recipeIds } }),
    },
    select: {
      date: true,
      price: true,
      quantity: true,
    },
  });

  // Group by month
  const monthlyData = new Map<number, number>();

  for (const record of salesRecords) {
    const month = record.date.getMonth();
    const revenue = new Decimal(record.price).times(record.quantity);
    monthlyData.set(month, (monthlyData.get(month) || 0) + revenue.toNumber());
  }

  // Calculate seasonal patterns
  const avgRevenue = Array.from(monthlyData.values()).reduce((a, b) => a + b, 0) / 12;

  const seasonalPatterns = Array.from(monthlyData.entries()).map(([month, revenue]) => ({
    month: month + 1, // Convert 0-11 to 1-12
    revenue: revenue.toFixed(2),
    deviation: ((revenue - avgRevenue) / avgRevenue * 100).toFixed(2),
    isPeak: revenue > avgRevenue * 1.2,
    isLow: revenue < avgRevenue * 0.8,
  }));

  return {
    patterns: seasonalPatterns,
    avgRevenue: avgRevenue.toFixed(2),
  };
}

export async function compareYearOverYear(
  companyId: number,
  metric: 'revenue' | 'production' | 'costs',
  year: number
) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  const previousStartDate = new Date(year - 1, 0, 1);
  const previousEndDate = new Date(year - 1, 11, 31, 23, 59, 59);

  let currentData: any;
  let previousData: any;

  switch (metric) {
    case 'revenue':
      currentData = await analyzeRevenueTrends({
        companyId,
        startDate,
        endDate,
        period: 'monthly',
      });
      previousData = await analyzeRevenueTrends({
        companyId,
        startDate: previousStartDate,
        endDate: previousEndDate,
        period: 'monthly',
      });
      break;
    case 'production':
      currentData = await analyzeProductionTrends({
        companyId,
        startDate,
        endDate,
        period: 'monthly',
      });
      previousData = await analyzeProductionTrends({
        companyId,
        startDate: previousStartDate,
        endDate: previousEndDate,
        period: 'monthly',
      });
      break;
    case 'costs':
      currentData = await analyzeIngredientCostTrends({
        companyId,
        startDate,
        endDate,
        period: 'monthly',
      });
      previousData = await analyzeIngredientCostTrends({
        companyId,
        startDate: previousStartDate,
        endDate: previousEndDate,
        period: 'monthly',
      });
      break;
  }

  const currentTotal = currentData.data.reduce((sum: number, d: any) => {
    const value = parseFloat(d.revenue || d.quantity || d.avgPrice || '0');
    return sum + value;
  }, 0);

  const previousTotal = previousData.data.reduce((sum: number, d: any) => {
    const value = parseFloat(d.revenue || d.quantity || d.avgPrice || '0');
    return sum + value;
  }, 0);

  const percentChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(2)
    : '0';

  return {
    currentYear: year,
    previousYear: year - 1,
    currentTotal: currentTotal.toFixed(2),
    previousTotal: previousTotal.toFixed(2),
    percentChange,
    isIncrease: currentTotal > previousTotal,
  };
}

// Helper functions
function groupByPeriod<T>(
  records: any[],
  period: 'daily' | 'weekly' | 'monthly',
  transform: (record: any) => T
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const record of records) {
    const date = new Date(record.date || record.productionDate);
    let periodKey: string;

    switch (period) {
      case 'daily':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-W${String(Math.ceil(date.getDate() / 7)).padStart(2, '0')}`;
        break;
      case 'monthly':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped.has(periodKey)) {
      grouped.set(periodKey, []);
    }
    grouped.get(periodKey)!.push(transform(record));
  }

  return grouped;
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateAverage(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function calculatePriceChange(records: { price: Decimal }[]): string {
  if (records.length < 2) return '0';
  const first = records[0].price;
  const last = records[records.length - 1].price;
  return first.gt(0) ? last.minus(first).dividedBy(first).times(100).toFixed(2) : '0';
}

function calculateOverallChange(data: any[]): string {
  if (data.length < 2) return '0';
  const first = parseFloat(data[0].avgPrice);
  const last = parseFloat(data[data.length - 1].avgPrice);
  return first > 0 ? ((last - first) / first * 100).toFixed(2) : '0';
}
