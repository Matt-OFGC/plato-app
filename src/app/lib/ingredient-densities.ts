export const ingredientDensities: Record<string, number> = {};

export function getIngredientDensityOrDefault(name: string, defaultDensity = 1) {
  return ingredientDensities[name] ?? defaultDensity;
}
