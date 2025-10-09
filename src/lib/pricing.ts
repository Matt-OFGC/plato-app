/**
 * Pricing and margin calculation utilities for recipes
 */

export interface MarginCalculation {
  cost: number;
  currentPrice: number | null;
  targetMargin: number;
  minMargin: number;
  suggestedPrice: number;
  actualMargin: number | null;
  status: 'good' | 'warning' | 'poor' | 'no-price';
  marginDifference: number | null;
}

/**
 * Calculate suggested price based on cost and target margin
 * Formula: price = cost / (1 - targetMargin/100)
 */
export function calculateSuggestedPrice(cost: number, targetMarginPercent: number): number {
  if (cost <= 0 || targetMarginPercent <= 0 || targetMarginPercent >= 100) {
    return 0;
  }
  return cost / (1 - targetMarginPercent / 100);
}

/**
 * Calculate actual margin percentage from cost and selling price
 * Formula: margin = ((price - cost) / price) * 100
 */
export function calculateActualMargin(cost: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return ((sellingPrice - cost) / sellingPrice) * 100;
}

/**
 * Get margin status based on actual margin vs thresholds
 */
export function getMarginStatus(
  actualMargin: number | null,
  targetMargin: number,
  minMargin: number
): 'good' | 'warning' | 'poor' | 'no-price' {
  if (actualMargin === null) return 'no-price';
  if (actualMargin >= targetMargin) return 'good';
  if (actualMargin >= minMargin) return 'warning';
  return 'poor';
}

/**
 * Comprehensive margin analysis for a recipe
 */
export function analyzeRecipeMargin(
  cost: number,
  currentPrice: number | null,
  targetMargin: number = 65,
  minMargin: number = 55
): MarginCalculation {
  const suggestedPrice = calculateSuggestedPrice(cost, targetMargin);
  const actualMargin = currentPrice ? calculateActualMargin(cost, currentPrice) : null;
  const status = getMarginStatus(actualMargin, targetMargin, minMargin);
  const marginDifference = actualMargin !== null ? actualMargin - targetMargin : null;

  return {
    cost,
    currentPrice,
    targetMargin,
    minMargin,
    suggestedPrice,
    actualMargin,
    status,
    marginDifference,
  };
}

/**
 * Format margin as percentage string
 */
export function formatMargin(margin: number | null): string {
  if (margin === null) return 'N/A';
  return `${margin.toFixed(1)}%`;
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
 * Get color class for margin status
 */
export function getMarginColorClass(status: 'good' | 'warning' | 'poor' | 'no-price'): string {
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
export function getMarginStatusLabel(status: 'good' | 'warning' | 'poor' | 'no-price'): string {
  switch (status) {
    case 'good':
      return 'On Target';
    case 'warning':
      return 'Below Target';
    case 'poor':
      return 'Urgent';
    case 'no-price':
      return 'No Price Set';
  }
}

