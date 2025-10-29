export type BaseUnit = 'g' | 'ml' | 'each';

// Comprehensive unit type supporting worldwide measurements
// Includes US, UK, metric, and compound units
export type Unit = 
  // Base units
  | BaseUnit
  // Metric weight
  | 'kg' | 'g'
  // Imperial weight
  | 'oz' | 'lb'
  // Metric volume
  | 'ml' | 'l'
  // US volume
  | 'fl oz' | 'floz' | 'cups' | 'tbsp' | 'tsp'
  // UK volume (different from US)
  | 'uk fl oz' | 'uk cup' | 'uk tbsp' | 'uk tsp'
  // Compound/container units (these work via parsing)
  | 'case' | 'cases' | 'box' | 'boxes' | 'bottle' | 'bottles' | 'can' | 'cans' | 'pack' | 'packs' | 'carton' | 'cartons'
  // Count units
  | 'slices' | 'piece' | 'pieces';

// Conversion factors to base units
// Verified against official US, UK, and metric standards
const CONVERSION_FACTORS: Record<string, number> = {
  // Weight (to grams)
  'g': 1,
  'kg': 1000,
  'oz': 28.3495,      // 1 oz = 28.3495 g (avoirdupois ounce)
  'lb': 453.592,      // 1 lb = 453.592 g = 16 oz
  
  // Volume (to ml) - Metric
  'ml': 1,
  'l': 1000,
  'litre': 1000,      // Alternative spelling
  'litres': 1000,
  'liter': 1000,
  'liters': 1000,
  
  // Volume (to ml) - US Standard measurements
  'fl oz': 29.5735,   // 1 US fl oz = 29.5735 ml
  'floz': 29.5735,    // Alias for 'fl oz' (without space)
  'fl-oz': 29.5735,   // Alternative format
  'cups': 236.588,    // 1 US cup = 236.588 ml (≈ 8 fl oz)
  'cup': 236.588,     // Singular
  'tbsp': 14.7868,    // 1 US tbsp = 14.7868 ml (≈ 3 tsp)
  'tablespoon': 14.7868,
  'tablespoons': 14.7868,
  'tsp': 4.92892,     // 1 US tsp = 4.92892 ml (exact conversion factor)
  'teaspoon': 4.92892,
  'teaspoons': 4.92892,
  
  // Volume (to ml) - UK/Imperial measurements (different from US!)
  'uk fl oz': 28.4131, // 1 UK fl oz = 28.4131 ml (different from US!)
  'uk floz': 28.4131,
  'uk cup': 284.131,   // 1 UK cup = 284.131 ml (different from US!)
  'uk tbsp': 17.7582,  // 1 UK tbsp = 17.7582 ml
  'uk tsp': 5.91939,  // 1 UK tsp = 5.91939 ml
  
  // Count
  'each': 1,
  'slices': 1,
  'piece': 1,
  'pieces': 1,
  
  // Compound/container units - default to common sizes (can be overridden)
  // These are generic defaults; actual size should be entered as compound unit like "6x12L"
  'case': 1000,        // Default: 1 case = 1000ml (user should override)
  'cases': 1000,
  'box': 1000,         // Default: 1 box = 1000ml
  'boxes': 1000,
  'bottle': 750,       // Default: standard wine bottle = 750ml
  'bottles': 750,
  'can': 330,          // Default: standard can = 330ml
  'cans': 330,
  'pack': 1000,        // Default: 1 pack = 1000ml
  'packs': 1000,
  'carton': 1000,      // Default: 1 carton = 1000ml
  'cartons': 1000,
};

// Parse compound unit strings like "6x12L", "case of 12x500ml", etc.
// Returns { multiplier: number, baseUnit: string, baseQuantity: number }
export function parseCompoundUnit(unitString: string): { multiplier: number; baseUnit: string; baseQuantity: number } | null {
  const normalized = unitString.toLowerCase().trim();
  
  // Pattern: "6x12L" or "6 x 12 l" or "6*12L"
  const compoundMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[x*×]\s*(\d+(?:\.\d+)?)\s*(ml|l|litre|litres|liter|liters|g|kg|oz|lb)/i);
  if (compoundMatch) {
    const multiplier = parseFloat(compoundMatch[1]);
    const quantity = parseFloat(compoundMatch[2]);
    const baseUnit = compoundMatch[3].toLowerCase();
    return { multiplier, baseUnit, baseQuantity: quantity };
  }
  
  // Pattern: "12x500ml" (quantity x size)
  const reverseMatch = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(ml|l|litre|litres|liter|liters|g|kg|oz|lb)/i);
  if (reverseMatch) {
    const multiplier = parseFloat(reverseMatch[1]);
    const quantity = parseFloat(reverseMatch[2]);
    const baseUnit = reverseMatch[3].toLowerCase();
    return { multiplier, baseUnit, baseQuantity: quantity };
  }
  
  return null;
}

// Normalize unit string (handle variations, lowercase, etc.)
function normalizeUnit(unit: string): string {
  let lower = unit.toLowerCase().trim();
  
  // Normalize variations
  const normalizations: Record<string, string> = {
    'floz': 'fl oz',
    'fl-oz': 'fl oz',
    'floz': 'fl oz',
    'liter': 'l',
    'litre': 'l',
    'liters': 'l',
    'litres': 'l',
    'cup': 'cups',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'piece': 'pieces',
    'case': 'cases',
    'box': 'boxes',
    'bottle': 'bottles',
    'can': 'cans',
    'pack': 'packs',
    'carton': 'cartons',
  };
  
  return normalizations[lower] || lower;
}

// Convert compound unit to base unit quantity
// Example: "case" where case is defined as "6x12L" = 72L = 72000ml
export function convertCompoundUnitToBase(
  quantity: number,
  compoundUnitString: string
): { amount: number; base: BaseUnit } | null {
  const parsed = parseCompoundUnit(compoundUnitString);
  if (!parsed) {
    // Try to look up in CONVERSION_FACTORS
    const normalized = normalizeUnit(compoundUnitString);
    const factor = CONVERSION_FACTORS[normalized];
    if (factor && ['ml', 'l'].includes(factor === 1 ? 'ml' : 'l')) {
      // It's a volume unit
      return { amount: quantity * factor, base: 'ml' };
    }
    return null;
  }
  
  // Calculate total base quantity
  const totalBaseQuantity = parsed.multiplier * parsed.baseQuantity;
  
  // Convert to ml if it's a volume unit
  const baseUnit = parsed.baseUnit.toLowerCase();
  if (['ml', 'l', 'litre', 'litres', 'liter', 'liters'].includes(baseUnit)) {
    const liters = baseUnit === 'l' || baseUnit.startsWith('lit') ? totalBaseQuantity : totalBaseQuantity / 1000;
    return { amount: quantity * liters * 1000, base: 'ml' };
  }
  
  // Convert to grams if it's a weight unit
  if (['g', 'kg', 'oz', 'lb'].includes(baseUnit)) {
    // First convert to grams
    let grams = totalBaseQuantity;
    if (baseUnit === 'kg') grams = totalBaseQuantity * 1000;
    else if (baseUnit === 'oz') grams = totalBaseQuantity * 28.3495;
    else if (baseUnit === 'lb') grams = totalBaseQuantity * 453.592;
    return { amount: quantity * grams, base: 'g' };
  }
  
  return null;
}

// Convert to base unit
export function toBase(amount: number, unit: Unit | string, density?: number): { amount: number; base: BaseUnit } {
  const unitString = String(unit);
  
  // First, try parsing as compound unit (e.g., "6x12L", "case of 6x12L")
  const compoundResult = convertCompoundUnitToBase(amount, unitString);
  if (compoundResult) {
    // If density provided and result is volume, apply density
    if (compoundResult.base === 'ml' && density) {
      return { amount: compoundResult.amount * density, base: 'g' };
    }
    return compoundResult;
  }
  
  const normalizedUnit = normalizeUnit(unitString);
  
  // Map normalized units to conversion factor keys (handles UK units, etc.)
  const volumeUnitMap: Record<string, string> = {
    'fl oz': 'fl oz',
    'floz': 'fl oz',
    'fl-oz': 'fl oz',
    'uk fl oz': 'uk fl oz',
    'uk floz': 'uk fl oz',
  };
  const volumeKey = volumeUnitMap[normalizedUnit] || normalizedUnit;
  
  // Comprehensive volume units (US, UK, Metric)
  const volumeUnits = [
    'ml', 'l', 'litre', 'litres', 'liter', 'liters',
    'fl oz', 'cups', 'cup', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
    'uk fl oz', 'uk cup', 'uk tbsp', 'uk tsp',
    'case', 'cases', 'box', 'boxes', 'bottle', 'bottles', 'can', 'cans', 'pack', 'packs', 'carton', 'cartons'
  ];
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  
  // Handle density conversion (volume -> weight when density is provided)
  if (density && volumeUnits.includes(volumeKey)) {
    const factor = CONVERSION_FACTORS[volumeKey];
    if (!factor) {
      return { amount: 0, base: 'g' };
    }
    const mlAmount = amount * factor;
    return { amount: mlAmount * density, base: 'g' };
  }
  
  // Weight units -> grams
  if (weightUnits.includes(normalizedUnit)) {
    const factor = CONVERSION_FACTORS[normalizedUnit];
    if (!factor) {
      return { amount: 0, base: 'g' };
    }
    return { amount: amount * factor, base: 'g' };
  }
  
  // Volume units -> ml
  if (volumeUnits.includes(volumeKey)) {
    const factor = CONVERSION_FACTORS[volumeKey];
    if (!factor) {
      return { amount: 0, base: 'ml' };
    }
    return { amount: amount * factor, base: 'ml' as BaseUnit };
  }
  
  // Count units -> each
  return { amount, base: 'each' };
}

// Convert from base unit
export function fromBase(amount: number, baseUnit: BaseUnit, targetUnit: Unit | string): number {
  const unitString = String(targetUnit);
  const normalizedTarget = normalizeUnit(unitString);
  
  // Map normalized units to conversion factor keys
  const volumeUnitMap: Record<string, string> = {
    'fl oz': 'fl oz',
    'floz': 'fl oz',
    'fl-oz': 'fl oz',
    'uk fl oz': 'uk fl oz',
    'uk floz': 'uk fl oz',
  };
  const volumeKey = volumeUnitMap[normalizedTarget] || normalizedTarget;
  
  const volumeUnits = [
    'ml', 'l', 'litre', 'litres', 'liter', 'liters',
    'fl oz', 'cups', 'cup', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
    'uk fl oz', 'uk cup', 'uk tbsp', 'uk tsp',
    'case', 'cases', 'box', 'boxes', 'bottle', 'bottles', 'can', 'cans', 'pack', 'packs', 'carton', 'cartons'
  ];
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  
  if (baseUnit === 'g' && weightUnits.includes(normalizedTarget)) {
    return amount / CONVERSION_FACTORS[normalizedTarget];
  }
  
  if (baseUnit === 'ml' && volumeUnits.includes(volumeKey)) {
    const factor = CONVERSION_FACTORS[volumeKey];
    if (!factor) {
      return amount;
    }
    return amount / factor;
  }
  
  if (baseUnit === 'each' && ['each', 'slices', 'piece', 'pieces'].includes(normalizedTarget)) {
    return amount;
  }
  
  return amount;
}

// Check if units are compatible
export function areUnitsCompatible(unit1: Unit | string, unit2: Unit | string): boolean {
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  const volumeUnits = [
    'ml', 'l', 'litre', 'litres', 'liter', 'liters',
    'fl oz', 'cups', 'tbsp', 'tsp',
    'uk fl oz', 'uk cup', 'uk tbsp', 'uk tsp',
    'case', 'cases', 'box', 'boxes', 'bottle', 'bottles', 'can', 'cans', 'pack', 'packs', 'carton', 'cartons'
  ];
  const countUnits = ['each', 'slices', 'piece', 'pieces'];
  
  const normalized1 = normalizeUnit(String(unit1));
  const normalized2 = normalizeUnit(String(unit2));
  
  // Check if either is a compound unit that can be converted
  const isCompound1 = parseCompoundUnit(String(unit1)) !== null;
  const isCompound2 = parseCompoundUnit(String(unit2)) !== null;
  
  // If either is compound, assume compatible (they'll be converted to base units)
  if (isCompound1 || isCompound2) {
    return true;
  }
  
  return (
    (weightUnits.includes(normalized1) && weightUnits.includes(normalized2)) ||
    (volumeUnits.includes(normalized1) && volumeUnits.includes(normalized2)) ||
    (countUnits.includes(normalized1) && countUnits.includes(normalized2))
  );
}

// Compute ingredient usage cost with density
export function computeIngredientUsageCostWithDensity(
  quantity: number,
  unit: Unit | string,
  packPrice: number,
  packQuantity: number,
  packUnit: Unit | string,
  density?: number
): number {
  // Safety checks
  if (!quantity || quantity === 0) {
    return 0;
  }
  
  if (!packPrice || packPrice === 0) {
    return 0;
  }
  
  if (!packQuantity || packQuantity === 0) {
    return 0;
  }
  
  // Normalize units for consistent checking
  const normalizedPackUnit = normalizeUnit(String(packUnit));
  const normalizedUnit = normalizeUnit(String(unit));
  
  // Define comprehensive unit categories (includes US, UK, metric, compound)
  const volumeUnits = [
    'ml', 'l', 'litre', 'litres', 'liter', 'liters',
    'fl oz', 'floz', 'fl-oz', 'cups', 'cup', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons',
    'uk fl oz', 'uk floz', 'uk cup', 'uk tbsp', 'uk tsp',
    'case', 'cases', 'box', 'boxes', 'bottle', 'bottles', 'can', 'cans', 'pack', 'packs', 'carton', 'cartons'
  ];
  const weightUnits = ['g', 'kg', 'oz', 'lb'];
  
  // Check if units are compound units (parse them)
  const packUnitString = String(packUnit);
  const unitString = String(unit);
  const parsedPackUnit = parseCompoundUnit(packUnitString);
  const parsedUnit = parseCompoundUnit(unitString);
  
  // Smart conversion: if pack is volume and recipe unit is 'oz', assume it's fluid ounces
  let adjustedUnit: Unit | string = unit;
  let adjustedNormalizedUnit = normalizedUnit;
  if (normalizedUnit === 'oz' && (volumeUnits.includes(normalizedPackUnit) || parsedPackUnit !== null)) {
    adjustedUnit = 'fl oz';
    adjustedNormalizedUnit = 'fl oz';
  }
  
  // Determine if units are volume or weight (check both normalized and parsed)
  const isRecipeVolume = volumeUnits.includes(adjustedNormalizedUnit) || (parsedUnit !== null && ['ml', 'l', 'litre', 'litres', 'liter', 'liters'].includes(parsedUnit.baseUnit));
  const isPackVolume = volumeUnits.includes(normalizedPackUnit) || (parsedPackUnit !== null && ['ml', 'l', 'litre', 'litres', 'liter', 'liters'].includes(parsedPackUnit.baseUnit));
  const isRecipeWeight = weightUnits.includes(adjustedNormalizedUnit) || (parsedUnit !== null && ['g', 'kg', 'oz', 'lb'].includes(parsedUnit.baseUnit));
  const isPackWeight = weightUnits.includes(normalizedPackUnit) || (parsedPackUnit !== null && ['g', 'kg', 'oz', 'lb'].includes(parsedPackUnit.baseUnit));
  
  // Only use density if converting between weight and volume
  // NEVER use density for volume-to-volume or weight-to-weight conversions
  const shouldUseDensity = density && ((isRecipeVolume && isPackWeight) || (isRecipeWeight && isPackVolume));
  
  // Convert both to base units
  // Use density ONLY when converting between incompatible types (weight ↔ volume)
  const { amount: baseQuantity, base: baseUnit } = toBase(quantity, adjustedUnit, shouldUseDensity ? density : undefined);
  const { amount: basePackQuantity, base: packBaseUnit } = toBase(packQuantity, packUnit, undefined); // Never use density for pack unit conversion
  
  // Safety checks
  if (!baseQuantity || !basePackQuantity || basePackQuantity === 0 || isNaN(baseQuantity) || isNaN(basePackQuantity)) {
    return 0;
  }
  
  // If base units match, simple calculation
  if (baseUnit === packBaseUnit) {
    const costPerBaseUnit = packPrice / basePackQuantity;
    return baseQuantity * costPerBaseUnit;
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

