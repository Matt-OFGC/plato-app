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
  
  // Handle density conversion (g/ml)
  if (density && (normalizedUnit === 'ml' || normalizedUnit === 'l' || normalizedUnit === 'fl oz' || normalizedUnit === 'cups' || normalizedUnit === 'tbsp' || normalizedUnit === 'tsp')) {
    const mlAmount = amount * CONVERSION_FACTORS[normalizedUnit];
    return { amount: mlAmount * density, base: 'g' };
  }
  
  // Weight units -> grams
  if (['g', 'kg', 'oz', 'lb'].includes(normalizedUnit)) {
    const factor = CONVERSION_FACTORS[normalizedUnit];
    if (!factor) {
      console.error(`❌ Missing conversion factor for unit: ${normalizedUnit}`);
      return { amount: 0, base: 'g' };
    }
    return { amount: amount * factor, base: 'g' };
  }
  
  // Volume units -> ml
  if (['ml', 'l', 'fl oz', 'cups', 'tbsp', 'tsp'].includes(normalizedUnit)) {
    const factor = CONVERSION_FACTORS[normalizedUnit];
    if (!factor) {
      console.error(`❌ Missing conversion factor for unit: ${normalizedUnit}`);
      return { amount: 0, base: 'ml' };
    }
    const result = { amount: amount * factor, base: 'ml' as BaseUnit };
    console.log(`✅ toBase conversion: ${amount} ${normalizedUnit} = ${result.amount} ${result.base}`);
    return result;
  }
  
  // Count units -> each
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
  // Safety check - log if inputs are invalid
  if (!quantity || quantity === 0) {
    return 0;
  }
  
  if (!packPrice || packPrice === 0) {
    console.warn('Invalid packPrice:', packPrice);
    return 0;
  }
  
  if (!packQuantity || packQuantity === 0) {
    console.warn('Invalid packQuantity:', packQuantity);
    return 0;
  }
  
  // If pack unit is volume and recipe unit is 'oz', treat it as 'fl oz'
  const volumeUnits = ['ml', 'l', 'fl oz', 'floz', 'cups', 'tbsp', 'tsp'];
  const normalizedPackUnit = normalizeUnit(packUnit);
  const normalizedUnit = normalizeUnit(unit);
  
  // Smart conversion: if pack is volume and recipe unit is 'oz', assume it's fluid ounces
  let adjustedUnit: Unit = unit;
  if (normalizedUnit === 'oz' && volumeUnits.includes(normalizedPackUnit)) {
    adjustedUnit = 'fl oz';
  }
  
  // Convert both to base units
  // Only use density if units are incompatible (weight vs volume)
  const isRecipeVolume = volumeUnits.includes(normalizeUnit(adjustedUnit));
  const isPackVolume = volumeUnits.includes(normalizedPackUnit);
  const shouldUseDensity = density && ((isRecipeVolume && !isPackVolume) || (!isRecipeVolume && isPackVolume));
  
  const { amount: baseQuantity, base: baseUnit } = toBase(quantity, adjustedUnit, shouldUseDensity ? density : undefined);
  const { amount: basePackQuantity, base: packBaseUnit } = toBase(packQuantity, packUnit, undefined); // Never use density for pack unit
  
  // Debug logging
  console.log('Cost calculation debug:', {
    quantity,
    unit: adjustedUnit,
    normalizedUnit,
    packQuantity,
    packUnit,
    normalizedPackUnit,
    baseQuantity,
    baseUnit,
    basePackQuantity,
    packBaseUnit,
    packPrice,
    density,
  });
  
  // Safety checks
  if (!baseQuantity || !basePackQuantity || basePackQuantity === 0 || isNaN(baseQuantity) || isNaN(basePackQuantity)) {
    console.error('❌ Failed base unit conversion - returning 0:', {
      quantity,
      unit: adjustedUnit,
      packQuantity,
      packUnit,
      baseQuantity,
      baseUnit,
      basePackQuantity,
      packBaseUnit,
      reason: !baseQuantity ? 'baseQuantity is falsy' : 
              !basePackQuantity ? 'basePackQuantity is falsy' :
              basePackQuantity === 0 ? 'basePackQuantity is 0' :
              isNaN(baseQuantity) ? 'baseQuantity is NaN' :
              isNaN(basePackQuantity) ? 'basePackQuantity is NaN' : 'unknown'
    });
    return 0;
  }
  
  // If base units match, simple calculation
  if (baseUnit === packBaseUnit) {
    const costPerBaseUnit = packPrice / basePackQuantity;
    const result = baseQuantity * costPerBaseUnit;
    console.log('✅ Cost calculation successful:', { 
      costPerBaseUnit, 
      result, 
      baseQuantity, 
      basePackQuantity,
      formula: `(${baseQuantity} / ${basePackQuantity}) * ${packPrice} = ${result}`
    });
    return result;
  }
  
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
  
  // If no density and units don't match, return 0
  console.error('❌ Units incompatible and no density:', {
    baseUnit,
    packBaseUnit,
    density,
    unit: adjustedUnit,
    packUnit,
    message: `Cannot convert ${baseUnit} to ${packBaseUnit} without density`
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

