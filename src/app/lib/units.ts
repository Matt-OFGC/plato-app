export type BaseUnit = 'g' | 'ml' | 'each';
export type Unit = BaseUnit | 'kg' | 'l' | 'slices' | 'cups' | 'tbsp' | 'tsp' | 'oz' | 'lb' | 'fl oz' | 'floz';

// Conversion factors to base units
const CONVERSION_FACTORS: Record<string, number> = {
  // Weight (to grams)
  'g': 1,
  'kg': 1000,
  'oz': 28.3495,
  'lb': 453.592,
  
  // Volume (to ml)
  'ml': 1,
  'l': 1000,
  'fl oz': 29.5735,
  'floz': 29.5735, // Alias for 'fl oz' (without space)
  'cups': 236.588,
  'tbsp': 14.7868,
  'tsp': 4.92892,
  
  // Count
  'each': 1,
  'slices': 1,
};

// Normalize unit string (handle 'floz' -> 'fl oz', lowercase, etc.)
function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  // Normalize 'floz' to 'fl oz' for consistent handling
  if (lower === 'floz' || lower === 'fl-oz') {
    return 'fl oz';
  }
  return lower;
}

// Convert to base unit
export function toBase(amount: number, unit: Unit, density?: number): { amount: number; base: BaseUnit } {
  const normalizedUnit = normalizeUnit(unit) as Unit;
  
  // Debug: Log conversion attempts
  console.log('📐 toBase conversion:', { amount, unit, normalizedUnit, density, hasConversionFactor: normalizedUnit in CONVERSION_FACTORS });
  
  // Handle density conversion (g/ml)
  if (density && (normalizedUnit === 'ml' || normalizedUnit === 'l' || normalizedUnit === 'fl oz' || normalizedUnit === 'cups' || normalizedUnit === 'tbsp' || normalizedUnit === 'tsp')) {
    const mlAmount = amount * (CONVERSION_FACTORS[normalizedUnit] || 1);
    const result = { amount: mlAmount * density, base: 'g' as BaseUnit };
    console.log('📐 Density conversion result:', result);
    return result;
  }
  
  // Weight units -> grams
  if (['g', 'kg', 'oz', 'lb'].includes(normalizedUnit)) {
    const factor = CONVERSION_FACTORS[normalizedUnit] || 1;
    const result = { amount: amount * factor, base: 'g' as BaseUnit };
    console.log('📐 Weight conversion result:', { ...result, factor, normalizedUnit });
    return result;
  }
  
  // Volume units -> ml
  if (['ml', 'l', 'fl oz', 'cups', 'tbsp', 'tsp'].includes(normalizedUnit)) {
    const factor = CONVERSION_FACTORS[normalizedUnit] || 1;
    const result = { amount: amount * factor, base: 'ml' as BaseUnit };
    console.log('📐 Volume conversion result:', { ...result, factor, normalizedUnit });
    return result;
  }
  
  // Count units -> each
  console.log('📐 Count unit (no conversion):', { amount, base: 'each' });
  return { amount, base: 'each' };
}

// Convert from base unit
export function fromBase(amount: number, baseUnit: BaseUnit, targetUnit: Unit): number {
  const normalizedTarget = normalizeUnit(targetUnit);
  
  if (baseUnit === 'g' && ['g', 'kg', 'oz', 'lb'].includes(normalizedTarget)) {
    return amount / CONVERSION_FACTORS[normalizedTarget];
  }
  
  if (baseUnit === 'ml' && ['ml', 'l', 'fl oz', 'cups', 'tbsp', 'tsp'].includes(normalizedTarget)) {
    return amount / CONVERSION_FACTORS[normalizedTarget];
  }
  
  if (baseUnit === 'each' && ['each', 'slices'].includes(normalizedTarget)) {
    return amount;
  }
  
  return amount;
}

// Check if units are compatible
export function areUnitsCompatible(unit1: Unit, unit2: Unit): boolean {
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  const volumeUnits = ['ml', 'l', 'fl oz', 'cups', 'tbsp', 'tsp'];
  const countUnits = ['each', 'slices'];
  
  const normalized1 = normalizeUnit(unit1);
  const normalized2 = normalizeUnit(unit2);
  
  return (
    (weightUnits.includes(normalized1) && weightUnits.includes(normalized2)) ||
    (volumeUnits.includes(normalized1) && volumeUnits.includes(normalized2)) ||
    (countUnits.includes(normalized1) && countUnits.includes(normalized2))
  );
}

// Compute ingredient usage cost with density
export function computeIngredientUsageCostWithDensity(
  quantity: number,
  unit: Unit,
  packPrice: number,
  packQuantity: number,
  packUnit: Unit,
  density?: number
): number {
  console.log('🚀 computeIngredientUsageCostWithDensity called:', {
    quantity,
    unit,
    packPrice,
    packQuantity,
    packUnit,
    density,
  });
  
  // If pack unit is volume and recipe unit is 'oz', treat it as 'fl oz'
  const volumeUnits = ['ml', 'l', 'fl oz', 'floz', 'cups', 'tbsp', 'tsp'];
  const normalizedPackUnit = normalizeUnit(packUnit);
  const normalizedUnit = normalizeUnit(unit);
  
  console.log('📋 Normalized units:', { normalizedUnit, normalizedPackUnit });
  
  // Smart conversion: if pack is volume and recipe unit is 'oz', assume it's fluid ounces
  let adjustedUnit: Unit = unit;
  if (normalizedUnit === 'oz' && volumeUnits.includes(normalizedPackUnit)) {
    adjustedUnit = 'fl oz';
  }
  
  // If pack unit is volume and recipe unit is weight (or vice versa), try to use density
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  const isPackVolume = volumeUnits.includes(normalizedPackUnit);
  const isRecipeWeight = weightUnits.includes(normalizeUnit(adjustedUnit));
  const isPackWeight = weightUnits.includes(normalizedPackUnit);
  const isRecipeVolume = volumeUnits.includes(normalizeUnit(adjustedUnit));
  
  // Use density if available and units are incompatible
  const useDensity = density && ((isPackVolume && isRecipeWeight) || (isPackWeight && isRecipeVolume));
  
  console.log('🔧 Unit analysis:', {
    isPackVolume,
    isRecipeWeight,
    isPackWeight,
    isRecipeVolume,
    useDensity,
    adjustedUnit,
  });
  
  // Additional validation - ensure inputs are positive numbers (check BEFORE conversion)
  if (quantity <= 0 || packQuantity <= 0 || packPrice <= 0) {
    console.warn('⚠️ Invalid input values:', { quantity, packQuantity, packPrice });
    return 0;
  }
  
  console.log('📐 Calling toBase for recipe quantity...');
  const { amount: baseQuantity, base: baseUnit } = toBase(quantity, adjustedUnit, useDensity ? density : undefined);
  console.log('📐 Recipe toBase result:', { baseQuantity, baseUnit });
  
  console.log('📐 Calling toBase for pack quantity...');
  const { amount: basePackQuantity, base: packBaseUnit } = toBase(packQuantity, packUnit);
  console.log('📐 Pack toBase result:', { basePackQuantity, packBaseUnit });
  
  // Debug logging for conversion issues - ALWAYS log for debugging
  console.log('🔍 Cost calculation debug:', {
    recipeQty: quantity,
    recipeUnit: adjustedUnit,
    normalizedRecipeUnit: normalizedUnit,
    packQty: packQuantity,
    packUnit: packUnit,
    normalizedPackUnit: normalizedPackUnit,
    baseQty: baseQuantity,
    baseUnit: baseUnit,
    packBaseQty: basePackQuantity,
    packBaseUnit: packBaseUnit,
    unitsMatch: baseUnit === packBaseUnit,
    density: density,
    useDensity: useDensity,
    packPrice: packPrice,
  });
  
  // Safety checks - use proper null/undefined/NaN checks (not falsy checks that exclude 0)
  if (baseQuantity == null || basePackQuantity == null || basePackQuantity === 0 || isNaN(baseQuantity) || isNaN(basePackQuantity) || !isFinite(baseQuantity) || !isFinite(basePackQuantity)) {
    console.warn('⚠️ Invalid base conversion:', { 
      baseQuantity, 
      basePackQuantity, 
      baseUnit, 
      packBaseUnit,
      recipeQty: quantity,
      recipeUnit: adjustedUnit,
      normalizedRecipeUnit: normalizedUnit,
      packQty: packQuantity,
      packUnit: packUnit,
      normalizedPackUnit: normalizedPackUnit,
    });
    return 0;
  }
  
  // If base units match, simple calculation
  if (baseUnit === packBaseUnit) {
    const costPerBaseUnit = packPrice / basePackQuantity;
    const result = baseQuantity * costPerBaseUnit;
    console.log('✅ Cost calculated:', { 
      costPerBaseUnit, 
      result,
      calculation: `${baseQuantity} * (${packPrice} / ${basePackQuantity}) = ${result}`,
      baseUnit,
      packBaseUnit,
    });
    return result;
  }
  
  // Debug: Log when units don't match
  console.warn('⚠️ Base units don\'t match:', {
    baseUnit,
    packBaseUnit,
    recipeUnit: adjustedUnit,
    packUnit: packUnit,
    normalizedRecipeUnit: normalizedUnit,
    normalizedPackUnit: normalizedPackUnit,
  });
  
  // If base units don't match but we have density, convert via density
  if (density) {
    if (baseUnit === 'ml' && packBaseUnit === 'g') {
      // Recipe is volume, pack is weight - convert pack to volume
      const packVolume = basePackQuantity / density;
      const costPerMl = packPrice / packVolume;
      return baseQuantity * costPerMl;
    } else if (baseUnit === 'g' && packBaseUnit === 'ml') {
      // Recipe is weight, pack is volume - convert pack to weight
      const packWeight = basePackQuantity * density;
      const costPerGram = packPrice / packWeight;
      return baseQuantity * costPerGram;
    }
  }
  
  // If no density and units don't match, log warning and return 0
  console.warn('⚠️ Units don\'t match and no density available:', {
    recipeUnit: adjustedUnit,
    packUnit: packUnit,
    baseUnit: baseUnit,
    packBaseUnit: packBaseUnit,
    density: density,
  });
  return 0;
}

// Compute recipe cost with density
export function computeRecipeCostWithDensity(
  ingredients: Array<{
    quantity: number;
    unit: Unit;
    packPrice: number;
    packQuantity: number;
    packUnit: Unit;
    density?: number;
  }>
): number {
  return ingredients.reduce((total, ingredient) => {
    return total + computeIngredientUsageCostWithDensity(
      ingredient.quantity,
      ingredient.unit,
      ingredient.packPrice,
      ingredient.packQuantity,
      ingredient.packUnit,
      ingredient.density
    );
  }, 0);
}

// Compute cost per output unit
export function computeCostPerOutputUnit(
  totalCost: number,
  outputQuantity: number,
  outputUnit: Unit
): number {
  return totalCost / outputQuantity;
}

