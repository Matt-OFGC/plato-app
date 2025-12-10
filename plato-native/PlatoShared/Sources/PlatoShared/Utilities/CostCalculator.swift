import Foundation

/// Utility for calculating recipe costs
public class CostCalculator {
    
    /// Calculate the cost of an ingredient usage in a recipe
    /// - Parameters:
    ///   - usageQuantity: The quantity needed in the recipe
    ///   - usageUnit: The unit of the usage quantity (e.g., "g", "ml", "each")
    ///   - packQuantity: The pack quantity of the ingredient (in base unit)
    ///   - packUnit: The base unit stored (e.g., "g", "ml", "each")
    ///   - packPrice: The price of the pack
    ///   - densityGPerMl: Optional density for volume-to-weight conversion (g/ml)
    /// - Returns: The cost of this ingredient usage, or nil if calculation fails
    public static func computeIngredientUsageCost(
        usageQuantity: Decimal,
        usageUnit: String,
        packQuantity: Decimal,
        packUnit: String,
        packPrice: Decimal,
        densityGPerMl: Decimal? = nil
    ) -> Decimal? {
        // Convert usage quantity to base unit
        guard let usageInBase = convertToBaseUnit(
            quantity: usageQuantity,
            unit: usageUnit,
            densityGPerMl: densityGPerMl
        ) else {
            return nil
        }
        
        // Calculate cost per unit in base unit
        guard packQuantity > 0 else {
            return nil
        }
        
        let costPerBaseUnit = packPrice / packQuantity
        
        // Calculate total cost
        return usageInBase * costPerBaseUnit
    }
    
    /// Calculate total recipe cost from ingredients
    public static func calculateRecipeCost(
        ingredients: [RecipeIngredient],
        availableIngredients: [APIIngredientResponse]
    ) -> Decimal {
        var totalCost: Decimal = 0
        
        for recipeIngredient in ingredients {
            // Find the matching ingredient in available ingredients
            guard let ingredientId = Int(recipeIngredient.ingredientId),
                  let availableIngredient = availableIngredients.first(where: { $0.id == ingredientId }) else {
                continue
            }
            
            // Get pack details
            guard let packQty = Decimal(string: availableIngredient.packQuantity),
                  let packPrice = Decimal(string: availableIngredient.packPrice) else {
                continue
            }
            
            let density = availableIngredient.densityGPerMl.flatMap { Decimal(string: $0) }
            
            // Calculate cost for this ingredient
            if let ingredientCost = computeIngredientUsageCost(
                usageQuantity: recipeIngredient.quantity,
                usageUnit: recipeIngredient.unit,
                packQuantity: packQty,
                packUnit: availableIngredient.packUnit,
                packPrice: packPrice,
                densityGPerMl: density
            ) {
                totalCost += ingredientCost
            }
        }
        
        return totalCost
    }
    
    /// Calculate cost per serving
    public static func calculateCostPerServing(
        totalCost: Decimal,
        servings: Decimal
    ) -> Decimal? {
        guard servings > 0 else {
            return nil
        }
        return totalCost / servings
    }
    
    /// Calculate food cost percentage
    public static func calculateFoodCostPercentage(
        costPerServing: Decimal,
        sellingPrice: Decimal
    ) -> Decimal? {
        guard sellingPrice > 0 else {
            return nil
        }
        return (costPerServing / sellingPrice) * 100
    }
    
    // MARK: - Unit Conversion
    
    /// Convert quantity to base unit (g, ml, or each)
    private static func convertToBaseUnit(
        quantity: Decimal,
        unit: String,
        densityGPerMl: Decimal? = nil
    ) -> Decimal? {
        let normalizedUnit = unit.lowercased().trimmingCharacters(in: .whitespaces)
        
        // Handle density conversion (volume to weight)
        if let density = densityGPerMl,
           ["ml", "l", "floz", "fl oz", "cups", "tbsp", "tsp", "pint", "quart", "gallon"].contains(normalizedUnit) {
            let mlAmount = convertToMl(quantity: quantity, unit: normalizedUnit)
            return mlAmount * density
        }
        
        // Weight units -> grams
        if ["g", "kg", "mg", "oz", "lb"].contains(normalizedUnit) {
            return convertToGrams(quantity: quantity, unit: normalizedUnit)
        }
        
        // Volume units -> ml
        if ["ml", "l", "floz", "fl oz", "cups", "tbsp", "tsp", "pint", "quart", "gallon"].contains(normalizedUnit) {
            return convertToMl(quantity: quantity, unit: normalizedUnit)
        }
        
        // Count units -> each (1:1 conversion)
        if ["each", "slices", "large", "medium", "small", "pinch", "dash"].contains(normalizedUnit) {
            return quantity
        }
        
        return nil
    }
    
    private static func convertToGrams(quantity: Decimal, unit: String) -> Decimal {
        let factors: [String: Decimal] = [
            "g": 1,
            "kg": 1000,
            "mg": 0.001,
            "oz": 28.3495,
            "lb": 453.592
        ]
        return quantity * (factors[unit] ?? 1)
    }
    
    private static func convertToMl(quantity: Decimal, unit: String) -> Decimal {
        let factors: [String: Decimal] = [
            "ml": 1,
            "l": 1000,
            "floz": 29.5735,
            "fl oz": 29.5735,
            "cups": 236.588,
            "tbsp": 14.7868,
            "tsp": 4.92892,
            "pint": 473.176,
            "quart": 946.353,
            "gallon": 3785.41
        ]
        return quantity * (factors[unit] ?? 1)
    }
}


