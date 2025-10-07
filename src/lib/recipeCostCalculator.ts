import { computeIngredientUsageCost, computeCostPerOutputUnit, Unit } from "./units";
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

export function calculateRecipeCost(
  recipe: RecipeData,
  ingredients: IngredientData[],
  allRecipes: RecipeData[]
): CostBreakdown {
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
    const subRecipeBreakdown = calculateRecipeCost(subRecipeData, ingredients, allRecipes);
    
    // Calculate how much of the sub-recipe we need
    const subRecipeCostPerUnit = computeCostPerOutputUnit({
      totalCost: subRecipeBreakdown.totalCost,
      yieldQuantity: subRecipeData.yieldQuantity,
    });

    const cost = subRecipeCostPerUnit * subRecipe.quantity;

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
