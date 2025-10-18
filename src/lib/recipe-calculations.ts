import { Unit, BaseUnit } from "@/generated/prisma";

// Utility function to convert between units
export function convertUnit(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
  densityGPerMl?: number
): number {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) return value;

  // Convert to base units first, then to target unit
  const fromBase = toBase(value, fromUnit, densityGPerMl);
  return fromBaseToUnit(fromBase.amount, fromBase.base, toUnit, densityGPerMl);
}

// Convert any unit to base unit (g, ml, each, slices)
export function toBase(
  value: number,
  unit: Unit,
  densityGPerMl?: number
): { amount: number; base: BaseUnit } {
  switch (unit) {
    // Weight units
    case "g":
      return { amount: value, base: "g" };
    case "kg":
      return { amount: value * 1000, base: "g" };
    case "mg":
      return { amount: value / 1000, base: "g" };
    case "lb":
      return { amount: value * 453.592, base: "g" };
    case "oz":
      return { amount: value * 28.3495, base: "g" };

    // Volume units
    case "ml":
      return { amount: value, base: "ml" };
    case "l":
      return { amount: value * 1000, base: "ml" };
    case "tsp":
      return { amount: value * 4.92892, base: "ml" };
    case "tbsp":
      return { amount: value * 14.7868, base: "ml" };
    case "cup":
      return { amount: value * 236.588, base: "ml" };
    case "floz":
      return { amount: value * 29.5735, base: "ml" };

    // Count units
    case "each":
      return { amount: value, base: "each" };
    case "slices":
      return { amount: value, base: "slices" };

    default:
      throw new Error(`Unknown unit: ${unit}`);
  }
}

// Convert from base unit to any unit
export function fromBaseToUnit(
  value: number,
  baseUnit: BaseUnit,
  targetUnit: Unit,
  densityGPerMl?: number
): number {
  // If target unit is the same as base unit, no conversion needed
  if (baseUnit === targetUnit) return value;

  switch (baseUnit) {
    case "g":
      switch (targetUnit) {
        case "g":
          return value;
        case "kg":
          return value / 1000;
        case "mg":
          return value * 1000;
        case "lb":
          return value / 453.592;
        case "oz":
          return value / 28.3495;
        case "ml":
          // Convert grams to ml using density (default to water density: 1g/ml)
          if (densityGPerMl) {
            return value / densityGPerMl;
          }
          // Default to water density if no density provided
          return value / 1.0;
        case "l":
          // Convert grams to liters using density
          if (densityGPerMl) {
            return value / densityGPerMl / 1000;
          }
          return value / 1000; // Default to water density
        case "tsp":
          // Convert grams to tsp using density
          if (densityGPerMl) {
            return (value / densityGPerMl) / 4.92892;
          }
          return value / 4.92892; // Default to water density
        case "tbsp":
          // Convert grams to tbsp using density
          if (densityGPerMl) {
            return (value / densityGPerMl) / 14.7868;
          }
          return value / 14.7868; // Default to water density
        case "cup":
          // Convert grams to cup using density
          if (densityGPerMl) {
            return (value / densityGPerMl) / 236.588;
          }
          return value / 236.588; // Default to water density
        case "floz":
          // Convert grams to floz using density
          if (densityGPerMl) {
            return (value / densityGPerMl) / 29.5735;
          }
          return value / 29.5735; // Default to water density
        default:
          throw new Error(`Cannot convert from g to ${targetUnit}`);
      }

    case "ml":
      switch (targetUnit) {
        case "ml":
          return value;
        case "l":
          return value / 1000;
        case "tsp":
          return value / 4.92892;
        case "tbsp":
          return value / 14.7868;
        case "cup":
          return value / 236.588;
        case "floz":
          return value / 29.5735;
        case "g":
          // Convert ml to grams using density (default to water density: 1g/ml)
          if (densityGPerMl) {
            return value * densityGPerMl;
          }
          // Default to water density if no density provided
          return value * 1.0;
        case "kg":
          // Convert ml to kg using density
          if (densityGPerMl) {
            return (value * densityGPerMl) / 1000;
          }
          return value / 1000; // Default to water density
        case "mg":
          // Convert ml to mg using density
          if (densityGPerMl) {
            return value * densityGPerMl * 1000;
          }
          return value * 1000; // Default to water density
        case "lb":
          // Convert ml to lb using density
          if (densityGPerMl) {
            return (value * densityGPerMl) / 453.592;
          }
          return value / 453.592; // Default to water density
        case "oz":
          // Convert ml to oz using density
          if (densityGPerMl) {
            return (value * densityGPerMl) / 28.3495;
          }
          return value / 28.3495; // Default to water density
        default:
          throw new Error(`Cannot convert from ml to ${targetUnit}`);
      }

    case "each":
      if (targetUnit === "each") return value;
      throw new Error(`Cannot convert from each to ${targetUnit}`);

    case "slices":
      if (targetUnit === "slices") return value;
      throw new Error(`Cannot convert from slices to ${targetUnit}`);

    default:
      throw new Error(`Unknown base unit: ${baseUnit}`);
  }
}

// Calculate the cost of a recipe item based on ingredient data
export function calculateRecipeItemCost(
  recipeQuantity: number,
  recipeUnit: Unit,
  ingredientPackPrice: number,
  ingredientPackQuantity: number,
  ingredientPackUnit: Unit,
  densityGPerMl?: number
): number {
  // Convert recipe quantity to the same unit as ingredient pack
  const recipeQuantityInPackUnit = convertUnit(
    recipeQuantity,
    recipeUnit,
    ingredientPackUnit,
    densityGPerMl
  );

  // Calculate cost per unit of the ingredient pack
  const costPerPackUnit = ingredientPackPrice / ingredientPackQuantity;

  // Calculate total cost for this recipe item
  return recipeQuantityInPackUnit * costPerPackUnit;
}

// Calculate total recipe cost from recipe items
export function calculateTotalRecipeCost(recipeItems: Array<{
  quantity: number;
  unit: Unit;
  ingredient: {
    packPrice: number;
    packQuantity: number;
    packUnit: Unit;
    densityGPerMl?: number | null;
  };
}>): number {
  return recipeItems.reduce((total, item) => {
    const itemCost = calculateRecipeItemCost(
      item.quantity,
      item.unit,
      item.ingredient.packPrice,
      item.ingredient.packQuantity,
      item.ingredient.packUnit,
      item.ingredient.densityGPerMl ?? undefined
    );
    return total + itemCost;
  }, 0);
}

// Calculate cost per output unit (e.g., per slice, per serving)
export function calculateCostPerOutputUnit(
  totalCost: number,
  yieldQuantity: number,
  yieldUnit: string
): number {
  return totalCost / yieldQuantity;
}

// Get all allergens from recipe items
export function getAllergensFromRecipeItems(recipeItems: Array<{
  ingredient: {
    allergens?: string | null;
  };
}>): string[] {
  const allergenSet = new Set<string>();
  
  recipeItems.forEach(item => {
    if (item.ingredient.allergens) {
      // Split allergens by comma and clean up
      const allergens = item.ingredient.allergens
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);
      
      allergens.forEach(allergen => allergenSet.add(allergen));
    }
  });
  
  return Array.from(allergenSet).sort();
}
