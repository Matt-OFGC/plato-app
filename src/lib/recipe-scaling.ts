import { computeIngredientUsageCostWithDensity, Unit } from "./units";

interface Ingredient {
  quantity: number;
  unit: string;
  costPerUnit?: number;
  name?: string;
}

interface FullIngredient {
  id: number;
  name: string;
  packPrice: number;
  packQuantity: number;
  packUnit: string;
  densityGPerMl?: number | null;
}

/**
 * Calculate total cost of ingredients, scaling based on servings
 * This is a simplified version that uses costPerUnit if available,
 * otherwise requires full ingredient data
 */
export function calcTotalCost(
  ingredients: Ingredient[],
  baseServings: number,
  servings: number
): number {
  if (!ingredients || ingredients.length === 0) return 0;
  
  const scaleFactor = baseServings > 0 ? servings / baseServings : 1;
  
  return ingredients.reduce((total, ing) => {
    if (!ing.quantity || ing.quantity <= 0) return total;
    
    const scaledQuantity = ing.quantity * scaleFactor;
    
    // If costPerUnit is available, use it (simpler calculation)
    if (ing.costPerUnit && ing.costPerUnit > 0) {
      return total + (scaledQuantity * ing.costPerUnit);
    }
    
    // Otherwise, costPerUnit should have been calculated upstream
    // Return 0 if we can't calculate (shouldn't happen if data is correct)
    return total;
  }, 0);
}

/**
 * Calculate total cost with full ingredient data and proper unit conversion
 */
export function calcTotalCostWithFullIngredients(
  ingredients: Ingredient[],
  fullIngredients: FullIngredient[],
  baseServings: number,
  servings: number
): number {
  if (!ingredients || ingredients.length === 0) return 0;
  
  const scaleFactor = baseServings > 0 ? servings / baseServings : 1;
  
  return ingredients.reduce((total, ing) => {
    if (!ing.quantity || ing.quantity <= 0) return total;
    
    const scaledQuantity = ing.quantity * scaleFactor;
    
    // Find the full ingredient data
    const fullIngredient = fullIngredients.find(
      fi => fi.name.toLowerCase().trim() === (ing.name || '').toLowerCase().trim()
    );
    
    if (!fullIngredient || !fullIngredient.packPrice || !fullIngredient.packQuantity || fullIngredient.packQuantity <= 0) {
      return total;
    }
    
    try {
      const cost = computeIngredientUsageCostWithDensity(
        scaledQuantity,
        ing.unit as Unit,
        fullIngredient.packPrice,
        fullIngredient.packQuantity,
        fullIngredient.packUnit as Unit,
        fullIngredient.densityGPerMl || undefined
      );
      
      return total + (cost || 0);
    } catch (error) {
      console.error('Error calculating cost for ingredient:', ing.name, error);
      return total;
    }
  }, 0);
}

export function scaleQuantity(quantity: number, baseServings: number, servings: number): number {
  if (baseServings <= 0) return quantity;
  return quantity * (servings / baseServings);
}

export function formatQty(quantity: number, unit?: string): string {
  if (!unit) return quantity.toString();
  
  // Format number to remove unnecessary decimals
  const formatted = quantity % 1 === 0 
    ? quantity.toString() 
    : quantity.toFixed(2).replace(/\.?0+$/, '');
  
  return `${formatted} ${unit}`;
}

