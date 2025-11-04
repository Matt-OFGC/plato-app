// Common ingredient densities (g/ml) for automatic conversion
// These are approximate values - can be overridden by user-set density
export const COMMON_INGREDIENT_DENSITIES: Record<string, number> = {
  // Common baking ingredients
  'butter': 0.911,
  'margarine': 0.910,
  'stork': 0.910,
  'shortening': 0.920,
  'lard': 0.920,
  'fluff': 0.65, // Marshmallow fluff - approximate
  'marshmallow fluff': 0.65,
  'marshmallow': 0.65,
  'honey': 1.42,
  'maple syrup': 1.37,
  'corn syrup': 1.38,
  'golden syrup': 1.44,
  'molasses': 1.42,
  'peanut butter': 1.00,
  'almond butter': 0.95,
  'jam': 1.35,
  'preserve': 1.35,
  'marmalade': 1.35,
  'cream cheese': 1.00,
  'sour cream': 1.02,
  'yogurt': 1.03,
  'greek yogurt': 1.05,
  'mayonnaise': 0.92,
  'oil': 0.92,
  'vegetable oil': 0.92,
  'olive oil': 0.92,
  'canola oil': 0.92,
  'sunflower oil': 0.92,
  'sesame oil': 0.92,
  'coconut oil': 0.92,
  'milk': 1.03,
  'whole milk': 1.03,
  'skim milk': 1.03,
  'cream': 1.00,
  'heavy cream': 0.99,
  'double cream': 0.99,
  'whipping cream': 0.99,
  'half and half': 1.02,
  'buttermilk': 1.03,
  'evaporated milk': 1.10,
  'condensed milk': 1.30,
  'coconut milk': 1.00,
  'almond milk': 1.00,
  'soy milk': 1.02,
  'oat milk': 1.02,
  'water': 1.00,
  'broth': 1.00,
  'stock': 1.00,
  'vinegar': 1.01,
  'wine': 0.99,
  'beer': 1.01,
  'sugar': 0.85,
  'granulated sugar': 0.85,
  'caster sugar': 0.85,
  'brown sugar': 0.82,
  'light brown sugar': 0.82,
  'dark brown sugar': 0.82,
  'powdered sugar': 0.60,
  'icing sugar': 0.60,
  'confectioners sugar': 0.60,
  'flour': 0.60,
  'all-purpose flour': 0.60,
  'plain flour': 0.60,
  'self-raising flour': 0.60,
  'self rising flour': 0.60,
  'bread flour': 0.60,
  'cake flour': 0.58,
  'whole wheat flour': 0.60,
  'cornstarch': 0.50,
  'cornflour': 0.50,
  'cocoa powder': 0.60,
  'chocolate chips': 0.70,
  'chocolate': 0.70,
  'dark chocolate': 0.70,
  'milk chocolate': 0.70,
  'white chocolate': 0.70,
  'nutella': 1.10,
  'nut butter': 1.00,
  'tahini': 1.00,
  'mustard': 1.24,
  'ketchup': 1.15,
  'tomato paste': 1.40,
  'tomato sauce': 1.05,
  'pesto': 0.95,
  'cheese': 1.00,
  'cheddar cheese': 1.00,
  'mozzarella': 1.00,
  'parmesan': 0.85,
  'egg': 1.03,
  'whole egg': 1.03,
  'egg white': 1.03,
  'egg yolk': 1.03,
  'vanilla extract': 0.88,
  'vanilla': 0.88,
  'lemon juice': 1.03,
  'lime juice': 1.03,
  'orange juice': 1.04,
  'applesauce': 1.05,
  'pumpkin puree': 1.03,
  'mashed banana': 1.00,
  'banana': 1.00,
  'avocado': 0.96,
  'salsa': 1.05,
  'hummus': 1.05,
};

/**
 * Get density for an ingredient by name
 * Returns density in g/ml, or null if not found
 */
export function getIngredientDensity(ingredientName: string): number | null {
  if (!ingredientName) return null;
  
  const normalizedName = ingredientName.toLowerCase().trim();
  
  // Direct lookup
  if (COMMON_INGREDIENT_DENSITIES[normalizedName]) {
    return COMMON_INGREDIENT_DENSITIES[normalizedName];
  }
  
  // Partial match - check if ingredient name contains any key
  for (const [key, density] of Object.entries(COMMON_INGREDIENT_DENSITIES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return density;
    }
  }
  
  return null;
}

/**
 * Get density for an ingredient, preferring user-set density over lookup
 */
export function getIngredientDensityOrDefault(
  ingredientName: string,
  userDensity?: number | null
): number | null {
  // Use user-set density if available
  if (userDensity && userDensity > 0) {
    return userDensity;
  }
  
  // Otherwise, try to look it up
  return getIngredientDensity(ingredientName);
}

