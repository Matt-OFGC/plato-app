export type BaseUnit = 'g' | 'ml' | 'each';
export type Unit = BaseUnit | 'kg' | 'l' | 'slices' | 'cups' | 'tbsp' | 'tsp' | 'oz' | 'lb' | 'fl oz';

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
  'cups': 236.588,
  'tbsp': 14.7868,
  'tsp': 4.92892,
  
  // Count
  'each': 1,
  'slices': 1,
};

// Convert to base unit
export function toBase(amount: number, unit: Unit, density?: number): { amount: number; base: BaseUnit } {
  const normalizedUnit = unit.toLowerCase() as Unit;
  
  // Handle density conversion (g/ml)
  if (density && (normalizedUnit === 'ml' || normalizedUnit === 'l' || normalizedUnit === 'fl oz' || normalizedUnit === 'cups' || normalizedUnit === 'tbsp' || normalizedUnit === 'tsp')) {
    const mlAmount = amount * CONVERSION_FACTORS[normalizedUnit];
    return { amount: mlAmount * density, base: 'g' };
  }
  
  // Weight units -> grams
  if (['g', 'kg', 'oz', 'lb'].includes(normalizedUnit)) {
    return { amount: amount * CONVERSION_FACTORS[normalizedUnit], base: 'g' };
  }
  
  // Volume units -> ml
  if (['ml', 'l', 'fl oz', 'cups', 'tbsp', 'tsp'].includes(normalizedUnit)) {
    return { amount: amount * CONVERSION_FACTORS[normalizedUnit], base: 'ml' };
  }
  
  // Count units -> each
  return { amount, base: 'each' };
}

// Convert from base unit
export function fromBase(amount: number, baseUnit: BaseUnit, targetUnit: Unit): number {
  const normalizedTarget = targetUnit.toLowerCase() as Unit;
  
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
  
  const normalized1 = unit1.toLowerCase() as Unit;
  const normalized2 = unit2.toLowerCase() as Unit;
  
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
  const { amount: baseQuantity, base: baseUnit } = toBase(quantity, unit, density);
  const { amount: basePackQuantity } = toBase(packQuantity, packUnit);
  
  const costPerBaseUnit = packPrice / basePackQuantity;
  return baseQuantity * costPerBaseUnit;
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
