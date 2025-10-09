/**
 * Pricing and food cost calculation utilities for recipes
 * 
 * Industry Standard: Food cost should be 25-35% of selling price
 * Formula: Food Cost % = (Recipe Cost / Selling Price) × 100
 */

export interface FoodCostAnalysis {
  cost: number;
  sellingPrice: number | null;
  targetFoodCost: number;  // e.g., 25%
  maxFoodCost: number;      // e.g., 35%
  suggestedPrice: number;
  actualFoodCost: number | null;  // Actual food cost %
  status: 'good' | 'warning' | 'poor' | 'no-price';
  foodCostDifference: number | null;
}

/**
 * Calculate suggested selling price based on cost and target food cost %
 * Formula: Selling Price = Cost / (Food Cost % / 100)
 * Example: £1 cost ÷ 0.25 (25%) = £4 selling price
 */
export function calculateSuggestedPrice(cost: number, targetFoodCostPercent: number): number {
  if (cost <= 0 || targetFoodCostPercent <= 0 || targetFoodCostPercent >= 100) {
    return 0;
  }
  return cost / (targetFoodCostPercent / 100);
}

/**
 * Calculate actual food cost percentage from cost and selling price
 * Formula: Food Cost % = (Cost / Selling Price) × 100
 * Example: £1 cost ÷ £4 price = 25% food cost
 */
export function calculateFoodCostPercent(cost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return (cost / sellingPrice) * 100;
}

/**
 * Get food cost status based on actual vs targets
 */
export function getFoodCostStatus(
  actualFoodCost: number | null,
  targetFoodCost: number,
  maxFoodCost: number
): 'good' | 'warning' | 'poor' | 'no-price' {
  if (actualFoodCost === null) return 'no-price';
  if (actualFoodCost <= targetFoodCost) return 'good';      // 25% or less = good
  if (actualFoodCost <= maxFoodCost) return 'warning';      // 25-35% = warning
  return 'poor';                                             // Over 35% = poor
}

/**
 * Comprehensive food cost analysis for a recipe
 */
export function analyzeRecipeFoodCost(
  cost: number,
  sellingPrice: number | null,
  targetFoodCost: number = 25,  // Industry standard: 25%
  maxFoodCost: number = 35       // Maximum: 35%
): FoodCostAnalysis {
  const suggestedPrice = calculateSuggestedPrice(cost, targetFoodCost);
  const actualFoodCost = sellingPrice ? calculateFoodCostPercent(cost, sellingPrice) : null;
  const status = getFoodCostStatus(actualFoodCost, targetFoodCost, maxFoodCost);
  const foodCostDifference = actualFoodCost !== null ? actualFoodCost - targetFoodCost : null;

  return {
    cost,
    sellingPrice,
    targetFoodCost,
    maxFoodCost,
    suggestedPrice,
    actualFoodCost,
    status,
    foodCostDifference,
  };
}

/**
 * Format food cost as percentage string
 */
export function formatFoodCost(foodCost: number | null): string {
  if (foodCost === null) return 'N/A';
  return `${foodCost.toFixed(1)}%`;
}

/**
 * Format price difference
 */
export function formatPriceDifference(current: number, suggested: number): string {
  const diff = suggested - current;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(2)}`;
}

/**
 * Get color class for food cost status
 */
export function getFoodCostColorClass(status: 'good' | 'warning' | 'poor' | 'no-price'): string {
  switch (status) {
    case 'good':
      return 'text-emerald-600 bg-emerald-50';
    case 'warning':
      return 'text-amber-600 bg-amber-50';
    case 'poor':
      return 'text-red-600 bg-red-50';
    case 'no-price':
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get status label
 */
export function getFoodCostStatusLabel(status: 'good' | 'warning' | 'poor' | 'no-price'): string {
  switch (status) {
    case 'good':
      return 'On Target';
    case 'warning':
      return 'Needs Review';
    case 'poor':
      return 'Too High!';
    case 'no-price':
      return 'No Price Set';
  }
}

/**
 * Calculate gross profit from food cost
 * If food cost is 25%, gross profit is 75%
 */
export function calculateGrossProfit(foodCostPercent: number): number {
  return 100 - foodCostPercent;
}

