export type BaseUnit = "g" | "ml" | "each";
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
  | "each";

type UnitKind = "mass" | "volume" | "each";

const MASS_TO_G: Record<Exclude<Unit, "ml" | "l" | "tsp" | "tbsp" | "cup" | "floz" | "each">, number> = {
  g: 1,
  kg: 1000,
  mg: 1 / 1000,
  lb: 453.59237,
  oz: 28.349523125,
};

// British-first: metric culinary measures and UK imperial where applicable
const VOLUME_TO_ML: Record<Exclude<Unit, "g" | "kg" | "mg" | "lb" | "oz" | "each">, number> = {
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
};

export function toBase(quantity: number, unit: Unit, densityGPerMl?: number): { amount: number; base: BaseUnit } {
  const kind = UNIT_KIND[unit];
  if (kind === "each") return { amount: quantity, base: "each" };

  if (kind === "mass") {
    const amountG = MASS_TO_G[unit as keyof typeof MASS_TO_G] * quantity;
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

  if (kind === "mass") {
    const per = MASS_TO_G[target as keyof typeof MASS_TO_G];
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

export function convertBetweenUnits(
  quantity: number,
  from: Unit,
  to: Unit,
  densityGPerMl?: number
): number {
  if (from === to) return quantity;
  const { amount, base } = toBase(quantity, from, densityGPerMl);
  return fromBase(amount, to, base === "g" ? densityGPerMl : densityGPerMl);
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
  };
}): number {
  const { usageQuantity, usageUnit, ingredient } = params;
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

export function computeCostPerOutputUnit(params: {
  totalCost: number;
  yieldQuantity: number;
}): number {
  if (params.yieldQuantity <= 0) return params.totalCost;
  return params.totalCost / params.yieldQuantity;
}


