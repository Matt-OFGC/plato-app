import Foundation

/// API Recipe response model (matches backend snake_case format)
public struct APIRecipeResponse: Decodable {
    public let id: Int
    public let name: String
    public let description: String?
    public let image_url: String?
    public let selling_price: Double?
    public let category: String?
    public let allergens: [String]?
    public let dietary_tags: [String]?
    public let shelf_life: String?
    public let storage: String?
    public let has_recent_changes: Bool?
    public let yieldQuantity: String?
    public let yieldUnit: String?
    public let items: [APIRecipeItem]?
    public let sections: [APIRecipeSection]?
    
    enum CodingKeys: String, CodingKey {
        case id, name, description, image_url, selling_price, category, allergens, dietary_tags, shelf_life, storage, has_recent_changes, items, sections, yieldQuantity, yieldUnit
    }
}

public struct APIRecipeItem: Decodable {
    public let id: Int
    public let quantity: Double
    public let unit: String
    public let ingredient: APIRecipeIngredient?
    
    enum CodingKeys: String, CodingKey {
        case id, quantity, unit, ingredient
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle ID as either Int or String
        if let intId = try? container.decode(Int.self, forKey: .id) {
            self.id = intId
        } else {
            let stringId = try container.decode(String.self, forKey: .id)
            guard let parsedId = Int(stringId) else {
                throw DecodingError.dataCorruptedError(forKey: .id, in: container, debugDescription: "Invalid id format")
            }
            self.id = parsedId
        }
        
        // Handle quantity as either String or Double (API returns as string)
        if let quantityString = try? container.decode(String.self, forKey: .quantity) {
            guard let parsedQuantity = Double(quantityString) else {
                throw DecodingError.dataCorruptedError(forKey: .quantity, in: container, debugDescription: "Invalid quantity format: \(quantityString)")
            }
            self.quantity = parsedQuantity
        } else {
            self.quantity = try container.decode(Double.self, forKey: .quantity)
        }
        
        self.unit = try container.decode(String.self, forKey: .unit)
        self.ingredient = try container.decodeIfPresent(APIRecipeIngredient.self, forKey: .ingredient)
    }
}

public struct APIRecipeIngredient: Decodable {
    public let id: Int
    public let name: String
    public let allergens: [String]?
}

public struct APIRecipeSection: Decodable {
    public let id: Int
    public let title: String
    public let items: [APIRecipeItem]?
    public let method: String?
    public let order: Int?
    public let bakeTemp: Int?
    public let bakeTime: Int?
    
    enum CodingKeys: String, CodingKey {
        case id, title, items, method, order, bakeTemp, bakeTime
    }
}

/// Recipe model matching the Prisma schema
public struct Recipe: Codable, Identifiable {
    public let id: String
    public let name: String
    public let description: String?
    public let imageUrl: String?
    public let categoryId: String?
    public let companyId: String
    public let createdById: String
    public let createdAt: Date
    public let updatedAt: Date
    public let servings: Int?
    public let prepTime: Int?
    public let cookTime: Int?
    public let totalTime: Int?
    public let isProtected: Bool
    public let recipeType: String? // "single" or "batch"
    public let batchSize: Int?
    
    public init(
        id: String,
        name: String,
        description: String? = nil,
        imageUrl: String? = nil,
        categoryId: String? = nil,
        companyId: String,
        createdById: String,
        createdAt: Date,
        updatedAt: Date,
        servings: Int? = nil,
        prepTime: Int? = nil,
        cookTime: Int? = nil,
        totalTime: Int? = nil,
        isProtected: Bool = false,
        recipeType: String? = nil,
        batchSize: Int? = nil
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.imageUrl = imageUrl
        self.categoryId = categoryId
        self.companyId = companyId
        self.createdById = createdById
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.servings = servings
        self.prepTime = prepTime
        self.cookTime = cookTime
        self.totalTime = totalTime
        self.isProtected = isProtected
        self.recipeType = recipeType
        self.batchSize = batchSize
    }
    
    /// Convert from API response format
    public init(from apiResponse: APIRecipeResponse, companyId: String, createdById: String) {
        self.id = String(apiResponse.id)
        self.name = apiResponse.name
        self.description = apiResponse.description
        self.imageUrl = apiResponse.image_url
        self.categoryId = nil // API returns category as string, not ID
        self.companyId = companyId
        self.createdById = createdById
        self.createdAt = Date() // API doesn't return these
        self.updatedAt = Date()
        self.servings = nil
        self.prepTime = nil
        self.cookTime = nil
        self.totalTime = nil
        self.isProtected = false
        self.recipeType = nil
        self.batchSize = nil
    }
}

/// Recipe with full details including ingredients and steps
public struct RecipeDetail: Codable {
    public let recipe: Recipe
    public let ingredients: [RecipeIngredient]
    public let steps: [RecipeStep]
    public let cost: RecipeCost?
    
    public init(recipe: Recipe, ingredients: [RecipeIngredient], steps: [RecipeStep], cost: RecipeCost?) {
        self.recipe = recipe
        self.ingredients = ingredients
        self.steps = steps
        self.cost = cost
    }
}

public struct RecipeIngredient: Codable, Identifiable {
    public let id: String
    public let ingredientId: String
    public let ingredientName: String
    public let quantity: Decimal
    public let unit: String
    public let cost: Decimal?
    public let sectionId: String?
    
    // Create a unique ID by combining sectionId and item id
    public var uniqueId: String {
        if let sectionId = sectionId {
            return "\(sectionId)-\(id)"
        }
        return id
    }
    
    public init(id: String, ingredientId: String, ingredientName: String, quantity: Decimal, unit: String, cost: Decimal? = nil, sectionId: String? = nil) {
        self.id = id
        self.ingredientId = ingredientId
        self.ingredientName = ingredientName
        self.quantity = quantity
        self.unit = unit
        self.cost = cost
        self.sectionId = sectionId
    }
}

public struct RecipeStep: Codable, Identifiable {
    public let id: String
    public let sectionId: String?
    public let stepNumber: Int
    public let instruction: String
    public let temperature: Int?
    public let duration: Int?
    public let hasTimer: Bool
    
    public init(id: String, sectionId: String?, stepNumber: Int, instruction: String, temperature: Int?, duration: Int?, hasTimer: Bool) {
        self.id = id
        self.sectionId = sectionId
        self.stepNumber = stepNumber
        self.instruction = instruction
        self.temperature = temperature
        self.duration = duration
        self.hasTimer = hasTimer
    }
}

public struct RecipeCost: Codable {
    public let totalCost: Decimal
    public let costPerServing: Decimal?
    public let costPerSlice: Decimal?
    public let foodCostPercentage: Decimal?
    
    public init(totalCost: Decimal, costPerServing: Decimal?, costPerSlice: Decimal?, foodCostPercentage: Decimal?) {
        self.totalCost = totalCost
        self.costPerServing = costPerServing
        self.costPerSlice = costPerSlice
        self.foodCostPercentage = foodCostPercentage
    }
}





