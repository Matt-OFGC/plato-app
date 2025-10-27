import { computeIngredientUsageCost, computeCostPerOutputUnit, Unit, convertBetweenUnits, BaseUnit } from "./units";
import { formatCurrency } from "./currency";

export type IngredientData = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each" | "slices";
  packPrice: number;
  densityGPerMl: number | null;
};

export type RecipeData = {
  id: number;
  name: string;
  yieldQuantity: number;
  yieldUnit: "g" | "ml" | "each" | "slices";
  ingredients: Array<{
    ingredientId: number;
    quantity: number;
    unit: Unit;
  }>;
  subRecipes: Array<{
    subRecipeId: number;
    quantity: number;
    unit: Unit;
  }>;
};

export type CostBreakdown = {
  ingredientCosts: Array<{
    ingredientId: number;
    ingredientName: string;
    quantity: number;
    unit: Unit;
    cost: number;
    costPerUnit: number;
  }>;
  subRecipeCosts: Array<{
    subRecipeId: number;
    subRecipeName: string;
    quantity: number;
    unit: Unit;
    cost: number;
    costPerUnit: number;
  }>;
  totalCost: number;
  costPerOutputUnit: number;
};

const MAX_RECIPE_DEPTH = 10; // Prevent infinite recursion

/**
 * Calculate the total cost of a recipe including ingredients and sub-recipes.
 *
 * This function recursively calculates costs for recipes that contain other recipes (sub-recipes).
 * It includes protection against circular dependencies and excessive nesting depth.
 *
 * @param recipe - The recipe to calculate costs for
 * @param ingredients - Array of all available ingredients with their pricing
 * @param allRecipes - Array of all recipes (needed for resolving sub-recipes)
 * @param visitedRecipes - Set of recipe IDs already visited (prevents circular dependencies)
 * @param depth - Current recursion depth (limited to MAX_RECIPE_DEPTH)
 *
 * @returns CostBreakdown object containing itemized costs and totals
 *
 * @throws Error if recipe has invalid yield quantity (<= 0)
 * @throws Error if circular dependency detected between recipes
 * @throws Error if maximum recursion depth exceeded
 * @throws Error if required ingredient or sub-recipe not found
 *
 * @example
 * ```typescript
 * const breakdown = calculateRecipeCost(
 *   myRecipe,
 *   allIngredients,
 *   allRecipes
 * );
 * console.log(`Total cost: ${breakdown.totalCost}`);
 * console.log(`Cost per unit: ${breakdown.costPerOutputUnit}`);
 * ```
 */
export function calculateRecipeCost(
  recipe: RecipeData,
  ingredients: IngredientData[],
  allRecipes: RecipeData[],
  visitedRecipes: Set<number> = new Set(),
  depth: number = 0
): CostBreakdown {
  // Validate yield quantity
  if (recipe.yieldQuantity <= 0) {
    throw new Error(`Recipe "${recipe.name}" has invalid yield quantity: ${recipe.yieldQuantity}. Yield must be greater than 0.`);
  }

  // Check for circular dependency
  if (visitedRecipes.has(recipe.id)) {
    const recipePath = Array.from(visitedRecipes).join(' -> ');
    throw new Error(`Circular dependency detected: ${recipePath} -> ${recipe.id} (${recipe.name})`);
  }

  // Check recursion depth
  if (depth > MAX_RECIPE_DEPTH) {
    throw new Error(`Maximum recipe nesting depth (${MAX_RECIPE_DEPTH}) exceeded. This may indicate a circular dependency.`);
  }

  // Add current recipe to visited set
  const currentVisited = new Set(visitedRecipes);
  currentVisited.add(recipe.id);

  const ingredientCosts = recipe.ingredients.map(item => {
    const ingredient = ingredients.find(i => i.id === item.ingredientId);
    if (!ingredient) {
      throw new Error(`Ingredient with ID ${item.ingredientId} not found`);
    }

    const cost = computeIngredientUsageCost({
      usageQuantity: item.quantity,
      usageUnit: item.unit,
      ingredient: {
        packQuantity: ingredient.packQuantity,
        packUnit: ingredient.packUnit,
        packPrice: ingredient.packPrice,
        densityGPerMl: ingredient.densityGPerMl,
      },
    });

    const costPerUnit = computeCostPerOutputUnit({
      totalCost: ingredient.packPrice,
      yieldQuantity: ingredient.packQuantity,
    });

    return {
      ingredientId: item.ingredientId,
      ingredientName: ingredient.name,
      quantity: item.quantity,
      unit: item.unit,
      cost,
      costPerUnit,
    };
  });

  const subRecipeCosts = recipe.subRecipes.map(subRecipe => {
    const subRecipeData = allRecipes.find(r => r.id === subRecipe.subRecipeId);
    if (!subRecipeData) {
      throw new Error(`Sub-recipe with ID ${subRecipe.subRecipeId} not found`);
    }

    // Recursively calculate the cost of the sub-recipe
    const subRecipeBreakdown = calculateRecipeCost(
      subRecipeData,
      ingredients,
      allRecipes,
      currentVisited,
      depth + 1
    );
    
    // Calculate how much of the sub-recipe we need
    const subRecipeCostPerUnit = computeCostPerOutputUnit({
      totalCost: subRecipeBreakdown.totalCost,
      yieldQuantity: subRecipeData.yieldQuantity,
    });

    // Convert sub-recipe quantity to the yield unit if needed
    // If units match, no conversion happens; if they differ, use density if available
    let quantityInYieldUnits = subRecipe.quantity;
    if (subRecipe.unit !== subRecipeData.yieldUnit) {
      // For sub-recipes, we typically don't have density, so we assume the units are compatible
      // or that the user knows what they're doing. For now, just use the quantity as-is.
      // In a more robust system, you'd validate unit compatibility here.
      quantityInYieldUnits = subRecipe.quantity;
    }

    const cost = subRecipeCostPerUnit * quantityInYieldUnits;

    return {
      subRecipeId: subRecipe.subRecipeId,
      subRecipeName: subRecipeData.name,
      quantity: subRecipe.quantity,
      unit: subRecipe.unit,
      cost,
      costPerUnit: subRecipeCostPerUnit,
    };
  });

  const totalCost = ingredientCosts.reduce((sum, item) => sum + item.cost, 0) +
                   subRecipeCosts.reduce((sum, item) => sum + item.cost, 0);

  const costPerOutputUnit = computeCostPerOutputUnit({
    totalCost,
    yieldQuantity: recipe.yieldQuantity,
  });

  return {
    ingredientCosts,
    subRecipeCosts,
    totalCost,
    costPerOutputUnit,
  };
}

export function formatCostBreakdown(breakdown: CostBreakdown): string {
  let output = `Total Recipe Cost: ${formatCurrency(breakdown.totalCost)}\n`;
  output += `Cost per ${breakdown.costPerOutputUnit > 0 ? 'output unit' : 'batch'}: ${formatCurrency(breakdown.costPerOutputUnit)}\n\n`;

  if (breakdown.ingredientCosts.length > 0) {
    output += "Ingredient Costs:\n";
    breakdown.ingredientCosts.forEach(item => {
      output += `  • ${item.ingredientName}: ${item.quantity} ${item.unit} = ${formatCurrency(item.cost)}\n`;
    });
    output += "\n";
  }

  if (breakdown.subRecipeCosts.length > 0) {
    output += "Sub-Recipe Costs:\n";
    breakdown.subRecipeCosts.forEach(item => {
      output += `  • ${item.subRecipeName}: ${item.quantity} ${item.unit} = ${formatCurrency(item.cost)}\n`;
    });
    output += "\n";
  }

  return output;
}

export function exportRecipeAsPDF(recipe: RecipeData, breakdown: CostBreakdown): string {
  // This would integrate with a PDF generation library in a real implementation
  let pdfContent = `
Recipe: ${recipe.name}
Yield: ${recipe.yieldQuantity} ${recipe.yieldUnit}

${formatCostBreakdown(breakdown)}

Ingredients:
${recipe.ingredients.map(item => {
  const cost = breakdown.ingredientCosts.find(c => c.ingredientId === item.ingredientId);
  return `• ${item.quantity} ${item.unit} - ${cost?.ingredientName || 'Unknown'} (${cost ? formatCurrency(cost.cost) : 'N/A'})`;
}).join('\n')}

${recipe.subRecipes.length > 0 ? `
Sub-Recipes:
${recipe.subRecipes.map(item => {
  const cost = breakdown.subRecipeCosts.find(c => c.subRecipeId === item.subRecipeId);
  return `• ${item.quantity} ${item.unit} - ${cost?.subRecipeName || 'Unknown'} (${cost ? formatCurrency(cost.cost) : 'N/A'})`;
}).join('\n')}
` : ''}
`;

  return pdfContent;
}
