/**
 * Batch Pricing Utilities
 * Handles calculation of best pricing tier from batch pricing options
 */

export interface BatchPricingTier {
  packQuantity: number; // Quantity in the same unit as the main packUnit
  packPrice: number;    // Total price for that quantity
}

export interface PricingResult {
  packQuantity: number;
  packPrice: number;
  costPerUnit: number;
  source: 'standard' | 'batch';
}

/**
 * Find the best pricing tier for a given quantity needed
 * @param quantityNeeded - The quantity needed (in base units)
 * @param standardPackQuantity - Standard pack quantity (in base units)
 * @param standardPackPrice - Standard pack price
 * @param batchPricing - Array of batch pricing tiers (optional)
 * @returns The best pricing to use
 */
export function getBestPricingTier(
  quantityNeeded: number,
  standardPackQuantity: number,
  standardPackPrice: number,
  batchPricing?: BatchPricingTier[] | null
): PricingResult {
  // Calculate cost per unit for standard pricing
  const standardCostPerUnit = standardPackPrice / standardPackQuantity;
  
  // Calculate how many standard packs are needed
  const standardPacksNeeded = Math.ceil(quantityNeeded / standardPackQuantity);
  const standardTotalCost = standardPacksNeeded * standardPackPrice;
  
  // If no batch pricing, return standard pricing
  if (!batchPricing || batchPricing.length === 0) {
    return {
      packQuantity: standardPackQuantity,
      packPrice: standardPackPrice,
      costPerUnit: standardCostPerUnit,
      source: 'standard',
    };
  }
  
  // Find the best pricing option
  let bestPricing: PricingResult = {
    packQuantity: standardPackQuantity,
    packPrice: standardPackPrice,
    costPerUnit: standardCostPerUnit,
    source: 'standard',
  };
  
  let bestTotalCost = standardTotalCost;
  
  // Check each batch pricing tier
  for (const tier of batchPricing) {
    if (tier.packQuantity <= 0 || tier.packPrice <= 0) continue;
    
    const tierCostPerUnit = tier.packPrice / tier.packQuantity;
    
    // Calculate how many batches of this tier are needed
    const batchesNeeded = Math.ceil(quantityNeeded / tier.packQuantity);
    const tierTotalCost = batchesNeeded * tier.packPrice;
    
    // If this tier is cheaper per unit and total cost is less
    if (tierCostPerUnit < bestPricing.costPerUnit && tierTotalCost < bestTotalCost) {
      bestPricing = {
        packQuantity: tier.packQuantity,
        packPrice: tier.packPrice,
        costPerUnit: tierCostPerUnit,
        source: 'batch',
      };
      bestTotalCost = tierTotalCost;
    }
  }
  
  // Also check if mixing tiers could be cheaper
  // For example: buying 1 case (6 units) + 1 single might be cheaper than 2 cases
  // This is a more complex optimization, but let's keep it simple for now
  // The user can always add more tiers if needed
  
  return bestPricing;
}

/**
 * Parse batch pricing from JSON (from database)
 */
export function parseBatchPricing(batchPricing: any): BatchPricingTier[] | null {
  if (!batchPricing) return null;
  
  try {
    const parsed = typeof batchPricing === 'string' 
      ? JSON.parse(batchPricing) 
      : batchPricing;
    
    if (!Array.isArray(parsed)) return null;
    
    return parsed
      .filter((tier: any) => 
        tier && 
        typeof tier.packQuantity === 'number' && 
        typeof tier.packPrice === 'number' &&
        tier.packQuantity > 0 &&
        tier.packPrice > 0
      )
      .map((tier: any) => ({
        packQuantity: tier.packQuantity,
        packPrice: tier.packPrice,
      }))
      .sort((a, b) => a.packQuantity - b.packQuantity); // Sort by quantity ascending
  } catch {
    return null;
  }
}






