/**
 * Common ingredient densities (g/ml) for automatic lookup
 * This helps users by auto-filling density so they don't need to know what it means
 */

export const COMMON_DENSITIES: Record<string, number> = {
  // Liquids - Dairy
  'milk': 1.03,
  'whole milk': 1.03,
  'full fat milk': 1.03,
  'semi-skimmed milk': 1.03,
  'skim milk': 1.04,
  'skimmed milk': 1.04,
  'cream': 1.01,
  'heavy cream': 1.01,
  'double cream': 1.01,
  'single cream': 1.02,
  'half and half': 1.01,
  'buttermilk': 1.03,
  
  // Liquids - Water & Beverages
  'water': 1.00,
  'juice': 1.04,
  'orange juice': 1.04,
  'apple juice': 1.04,
  'coffee': 1.00,
  'tea': 1.00,
  'espresso': 1.00,
  
  // Liquids - Oils & Fats
  'oil': 0.92,
  'olive oil': 0.92,
  'vegetable oil': 0.92,
  'canola oil': 0.92,
  'sunflower oil': 0.92,
  'coconut oil': 0.92,
  'butter': 0.91,
  'melted butter': 0.91,
  'ghee': 0.90,
  
  // Liquids - Sweeteners
  'honey': 1.42,
  'maple syrup': 1.37,
  'golden syrup': 1.40,
  'corn syrup': 1.38,
  'agave': 1.36,
  'molasses': 1.40,
  
  // Liquids - Condiments
  'soy sauce': 1.12,
  'vinegar': 1.01,
  'balsamic vinegar': 1.03,
  'wine': 0.99,
  'beer': 1.00,
  
  // Dry Ingredients - Flours
  'flour': 0.53,
  'all-purpose flour': 0.53,
  'plain flour': 0.53,
  'bread flour': 0.54,
  'cake flour': 0.51,
  'self-raising flour': 0.53,
  'self raising flour': 0.53,
  'whole wheat flour': 0.55,
  'wholemeal flour': 0.55,
  
  // Dry Ingredients - Sugars
  'sugar': 0.85,
  'granulated sugar': 0.85,
  'caster sugar': 0.85,
  'white sugar': 0.85,
  'brown sugar': 0.90,
  'packed brown sugar': 0.90,
  'light brown sugar': 0.85,
  'dark brown sugar': 0.95,
  'icing sugar': 0.56,
  'powdered sugar': 0.56,
  'confectioners sugar': 0.56,
  
  // Dry Ingredients - Cocoa & Chocolate
  'cocoa powder': 0.48,
  'cocoa': 0.48,
  'chocolate chips': 0.60,
  'dark chocolate': 0.60,
  'milk chocolate': 0.58,
  
  // Dry Ingredients - Baking
  'baking powder': 0.96,
  'baking soda': 0.87,
  'bicarbonate of soda': 0.87,
  'yeast': 0.52,
  'instant yeast': 0.52,
  'active dry yeast': 0.52,
  'cornstarch': 0.52,
  'cornflour': 0.52,
  
  // Dry Ingredients - Grains & Pasta
  'rice': 0.80,
  'white rice': 0.80,
  'brown rice': 0.78,
  'pasta': 0.60,
  'oats': 0.41,
  'rolled oats': 0.41,
  'quinoa': 0.75,
  'couscous': 0.70,
  
  // Dry Ingredients - Nuts & Seeds
  'almonds': 0.60,
  'walnuts': 0.48,
  'pecans': 0.48,
  'cashews': 0.60,
  'peanuts': 0.65,
  'peanut butter': 1.08,
  'almond butter': 1.06,
  
  // Seasonings & Spices
  'salt': 1.20,
  'table salt': 1.20,
  'sea salt': 1.18,
  'pepper': 0.58,
  'black pepper': 0.58,
  
  // Misc
  'breadcrumbs': 0.30,
  'panko': 0.25,
};

/**
 * Search for ingredient density by name
 * Returns null if not found
 */
export function findDensityByName(ingredientName: string): number | null {
  if (!ingredientName) return null;
  
  const searchName = ingredientName.toLowerCase().trim();
  
  // Exact match first
  if (COMMON_DENSITIES[searchName]) {
    return COMMON_DENSITIES[searchName];
  }
  
  // Partial match - find if the ingredient name contains any key
  for (const [key, density] of Object.entries(COMMON_DENSITIES)) {
    if (searchName.includes(key) || key.includes(searchName)) {
      return density;
    }
  }
  
  return null;
}

/**
 * Get density with explanation for user
 */
export function getDensityInfo(ingredientName: string): { density: number | null; explanation: string } {
  const density = findDensityByName(ingredientName);
  
  if (density) {
    return {
      density,
      explanation: `Auto-detected density: ${density} g/ml (allows weight ↔ volume conversion)`
    };
  }
  
  return {
    density: null,
    explanation: 'Optional: Add density (g/ml) to enable weight ↔ volume conversion'
  };
}

