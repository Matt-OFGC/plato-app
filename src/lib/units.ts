export type BaseUnit = "g" | "ml" | "each" | "slices";
export type Unit =
  | "g"
  | "kg"
  | "mg"
  | "lb"
  | "oz"
  | "ml"
  | "l"
  | "pint"
  | "quart"
  | "gallon"
  | "tsp"
  | "tbsp"
  | "cup"
  | "floz"
  | "each"
  | "slices"
  | "pinch"
  | "dash"
  | "large"
  | "medium"
  | "small";

type UnitKind = "mass" | "volume" | "each" | "slices" | "pinch" | "dash" | "size";

const MASS_TO_G: Record<"g" | "kg" | "mg" | "lb" | "oz", number> = {
  g: 1,
  kg: 1000,
  mg: 1 / 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

// British-first: metric culinary measures and UK imperial where applicable
const VOLUME_TO_ML: Record<"ml" | "l" | "tsp" | "tbsp" | "cup" | "floz" | "pint" | "quart" | "gallon", number> = {
  ml: 1,
  l: 1000,
  tsp: 5, // metric teaspoon
  tbsp: 15, // metric tablespoon
  cup: 250, // metric cup
  floz: 28.4130625, // UK imperial fluid ounce
  pint: 568.26125, // UK imperial pint
  quart: 1136.5225, // UK imperial quart (2 pints)
  gallon: 4546.09, // UK imperial gallon (8 pints)
};

// Small volume measurements
const PINCH_TO_ML: Record<"pinch" | "dash", number> = {
  pinch: 0.5, // approximately 1/8 tsp
  dash: 0.25, // approximately 1/16 tsp
};

// Size-based measurements (approximate weights)
const SIZE_TO_G: Record<"large" | "medium" | "small", number> = {
  large: 100, // approximate weight for large items like eggs, onions
  medium: 60, // approximate weight for medium items
  small: 30, // approximate weight for small items
};

// Discrete items - slices are treated as discrete items
const DISCRETE_TO_EACH: Record<"each" | "slices", number> = {
  each: 1,
  slices: 1, // 1 slice = 1 slice
};

const UNIT_KIND: Record<Unit, UnitKind> = {
  g: "mass",
  kg: "mass",
  mg: "mass",
  lb: "mass",
  oz: "mass",
  ml: "volume",
  l: "volume",
  pint: "volume",
  quart: "volume",
  gallon: "volume",
  tsp: "volume",
  tbsp: "volume",
  cup: "volume",
  floz: "volume",
  each: "each",
  slices: "slices",
  pinch: "pinch",
  dash: "dash",
  large: "size",
  medium: "size",
  small: "size",
};

/**
 * Convert a quantity from any unit to its base unit (g, ml, each, or slices).
 *
 * This function normalizes measurements to base units for consistent calculations.
 * Volume-to-mass conversions require density when available.
 *
 * @param quantity - The amount to convert
 * @param unit - The source unit (e.g., "kg", "cup", "tbsp")
 * @param densityGPerMl - Optional density for volume-to-mass conversions (grams per milliliter)
 *
 * @returns Object with normalized amount and base unit
 *
 * @example
 * ```typescript
 * // Convert 2 cups of flour to grams (requires density)
 * const flour = toBase(2, "cup", 0.6); // { amount: 300, base: "g" }
 *
 * // Convert 1 kg to grams
 * const weight = toBase(1, "kg"); // { amount: 1000, base: "g" }
 * ```
 */
export function toBase(quantity: number, unit: Unit, densityGPerMl?: number): { amount: number; base: BaseUnit } {
  const kind = UNIT_KIND[unit];
  if (kind === "each") return { amount: quantity, base: "each" };
  if (kind === "slices") return { amount: quantity, base: "slices" };

  if (kind === "mass") {
    const amountG = MASS_TO_G[unit as keyof typeof MASS_TO_G] * quantity;
    return { amount: amountG, base: "g" };
  }

  if (kind === "pinch" || kind === "dash") {
    const amountMl = PINCH_TO_ML[unit as keyof typeof PINCH_TO_ML] * quantity;
    if (densityGPerMl == null) return { amount: amountMl, base: "ml" };
    return { amount: amountMl * densityGPerMl, base: "g" };
  }

  if (kind === "size") {
    const amountG = SIZE_TO_G[unit as keyof typeof SIZE_TO_G] * quantity;
    return { amount: amountG, base: "g" };
  }

  // volume
  const amountMl = VOLUME_TO_ML[unit as keyof typeof VOLUME_TO_ML] * quantity;
  if (densityGPerMl == null) return { amount: amountMl, base: "ml" };
  return { amount: amountMl * densityGPerMl, base: "g" };
}

export function fromBase(amount: number, target: Unit, densityGPerMl?: number): number {
  const kind = UNIT_KIND[target];
  if (kind === "each") return amount; // amount is already count
  if (kind === "slices") return amount; // amount is already count

  if (kind === "mass") {
    const per = MASS_TO_G[target as keyof typeof MASS_TO_G];
    return amount / per;
  }

  if (kind === "pinch" || kind === "dash") {
    const perMl = PINCH_TO_ML[target as keyof typeof PINCH_TO_ML];
    // if amount is in grams but converting to volume and density provided, convert g -> ml first
    const amountMl = densityGPerMl ? amount / densityGPerMl : amount;
    return amountMl / perMl;
  }

  if (kind === "size") {
    const per = SIZE_TO_G[target as keyof typeof SIZE_TO_G];
    return amount / per;
  }

  // target is volume
  const perMl = VOLUME_TO_ML[target as keyof typeof VOLUME_TO_ML];
  // if amount is in grams but converting to volume and density provided, convert g -> ml first
  const amountMl = densityGPerMl ? amount / densityGPerMl : amount;
  return amountMl / perMl;
}

export function normalizeToBaseUnit(quantity: number, unit: Unit, densityGPerMl?: number): { base: BaseUnit; amount: number } {
  return toBase(quantity, unit, densityGPerMl);
}

/**
 * Convert a quantity from one unit to another unit.
 *
 * Handles conversions within the same category (mass-to-mass, volume-to-volume) and
 * cross-category conversions (volume-to-mass) when density is provided.
 *
 * @param quantity - The amount to convert
 * @param from - The source unit
 * @param to - The target unit
 * @param densityGPerMl - Optional density for cross-category conversions (grams per milliliter)
 *
 * @returns The converted quantity in the target unit
 *
 * @example
 * ```typescript
 * // Convert 2 kg to grams
 * const grams = convertBetweenUnits(2, "kg", "g"); // 2000
 *
 * // Convert 250ml of milk to grams (requires density)
 * const milkGrams = convertBetweenUnits(250, "ml", "g", 1.03); // 257.5
 * ```
 */
export function convertBetweenUnits(
  quantity: number,
  from: Unit,
  to: Unit,
  densityGPerMl?: number
): number {
  if (from === to) return quantity;
  const { amount, base } = toBase(quantity, from, densityGPerMl);
  return fromBase(amount, to, densityGPerMl);
}

export function costPerBaseUnit(packPrice: number, packQuantity: number, packUnit: BaseUnit): number {
  // price per gram/ml/each depending on packUnit
  return packPrice / packQuantity;
}

export function computeIngredientUsageCost(params: {
  usageQuantity: number;
  usageUnit: Unit;
  ingredient: {
    packQuantity: number;
    packUnit: BaseUnit;
    packPrice: number;
    densityGPerMl?: number | null;
  } | null;
}): number {
  const { usageQuantity, usageUnit, ingredient } = params;
  
  // Return 0 if ingredient is null/undefined
  if (!ingredient) {
    return 0;
  }
  
  const { amount: usageBaseAmount, base: usageBase } = toBase(
    usageQuantity,
    usageUnit,
    ingredient.densityGPerMl == null ? undefined : Number(ingredient.densityGPerMl)
  );

  // Ensure packUnit matches the base kind; if pack is ml but usage converts to g via density, both are base units
  const pricePerBase = ingredient.packPrice / Number(ingredient.packQuantity);
  return pricePerBase * usageBaseAmount;
}

export function computeRecipeCost(params: {
  items: Array<{
    quantity: number;
    unit: Unit;
    ingredient: {
      packQuantity: number;
      packUnit: BaseUnit;
      packPrice: number;
      densityGPerMl?: number | null;
    };
  }>;
}): number {
  const subtotal = params.items.reduce((sum, item) => {
    return sum +
      computeIngredientUsageCost({
        usageQuantity: item.quantity,
        usageUnit: item.unit,
        ingredient: item.ingredient,
      });
  }, 0);
  return subtotal;
}

// Enhanced recipe cost calculation with automatic density lookup
export function computeRecipeCostWithDensity(params: {
  items: Array<{
    quantity: number;
    unit: Unit;
    ingredient: {
      name: string;
      packQuantity: number;
      packUnit: BaseUnit;
      packPrice: number;
      densityGPerMl?: number | null;
    };
  }>;
}): number {
  const subtotal = params.items.reduce((sum, item) => {
    return sum +
      computeIngredientUsageCostWithDensity({
        usageQuantity: item.quantity,
        usageUnit: item.unit,
        ingredient: item.ingredient,
      });
  }, 0);
  return subtotal;
}

export function computeCostPerOutputUnit(params: {
  totalCost: number;
  yieldQuantity: number;
}): number {
  if (params.yieldQuantity <= 0) return params.totalCost;
  return params.totalCost / params.yieldQuantity;
}

// Comprehensive ingredient density database for accurate volume-to-weight conversions
export const INGREDIENT_DENSITIES: Record<string, number> = {
  // Baking ingredients (grams per ml)
  "flour": 0.6,
  "plain flour": 0.6,
  "all-purpose flour": 0.6,
  "bread flour": 0.6,
  "cake flour": 0.5,
  "self-raising flour": 0.6,
  "whole wheat flour": 0.6,
  "sugar": 0.85,
  "granulated sugar": 0.85,
  "caster sugar": 0.85,
  "brown sugar": 0.8,
  "icing sugar": 0.6,
  "powdered sugar": 0.6,
  "baking powder": 0.8,
  "baking soda": 0.87,
  "bicarbonate of soda": 0.87,
  "salt": 1.2,
  "table salt": 1.2,
  "sea salt": 1.1,
  "cocoa powder": 0.4,
  "cornstarch": 0.6,
  "corn flour": 0.6,
  "coconut flour": 0.4,
  "almond flour": 0.4,
  "ground almonds": 0.4,
  
  // Dairy products
  "milk": 1.03,
  "whole milk": 1.03,
  "skim milk": 1.03,
  "butter": 0.91,
  "margarine": 0.91,
  "cream": 1.0,
  "heavy cream": 1.0,
  "double cream": 1.0,
  "single cream": 1.0,
  "yogurt": 1.05,
  "greek yogurt": 1.05,
  "cream cheese": 1.0,
  "sour cream": 1.0,
  
  // Oils and fats
  "vegetable oil": 0.92,
  "olive oil": 0.92,
  "coconut oil": 0.92,
  "sunflower oil": 0.92,
  "rapeseed oil": 0.92,
  "sesame oil": 0.92,
  
  // Nuts and seeds
  "almonds": 0.6,
  "walnuts": 0.6,
  "pecans": 0.6,
  "hazelnuts": 0.6,
  "peanuts": 0.6,
  "cashews": 0.6,
  "pistachios": 0.6,
  "sesame seeds": 0.6,
  "poppy seeds": 0.6,
  "chia seeds": 0.6,
  "flax seeds": 0.6,
  
  // Spices and herbs
  "cinnamon": 0.4,
  "ginger": 0.4,
  "nutmeg": 0.4,
  "cloves": 0.4,
  "cardamom": 0.4,
  "vanilla": 0.4,
  "paprika": 0.4,
  "cumin": 0.4,
  "coriander": 0.4,
  "oregano": 0.1,
  "basil": 0.1,
  "thyme": 0.1,
  "rosemary": 0.1,
  "parsley": 0.1,
  
  // Other common ingredients
  "honey": 1.4,
  "maple syrup": 1.3,
  "molasses": 1.4,
  "golden syrup": 1.4,
  "jam": 1.3,
  "jelly": 1.3,
  "peanut butter": 1.0,
  "almond butter": 1.0,
  "tahini": 1.0,
  "vinegar": 1.0,
  "balsamic vinegar": 1.0,
  "lemon juice": 1.0,
  "lime juice": 1.0,
  "orange juice": 1.0,
  "tomato paste": 1.2,
  "tomato puree": 1.0,
  "coconut milk": 1.0,
  "coconut cream": 1.0,
};

// Function to get ingredient density by name (case-insensitive)
export function getIngredientDensity(ingredientName: string): number | undefined {
  const normalizedName = ingredientName.toLowerCase().trim();
  return INGREDIENT_DENSITIES[normalizedName];
}

// Enhanced cost calculation with automatic density lookup
export function computeIngredientUsageCostWithDensity(params: {
  usageQuantity: number;
  usageUnit: Unit;
  ingredient: {
    name: string;
    packQuantity: number;
    packUnit: BaseUnit;
    packPrice: number;
    densityGPerMl?: number | null;
  } | null;
}): number {
  const { usageQuantity, usageUnit, ingredient } = params;
  
  if (!ingredient) return 0;
  
  // Use provided density or look it up from the database
  const density = ingredient.densityGPerMl || getIngredientDensity(ingredient.name);
  
  return computeIngredientUsageCost({
    usageQuantity,
    usageUnit,
    ingredient: {
      packQuantity: ingredient.packQuantity,
      packUnit: ingredient.packUnit,
      packPrice: ingredient.packPrice,
      densityGPerMl: density || undefined,
    }
  });
}


