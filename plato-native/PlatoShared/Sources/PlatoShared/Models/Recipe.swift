import Foundation

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
}

/// Recipe with full details including ingredients and steps
public struct RecipeDetail: Codable {
    public let recipe: Recipe
    public let ingredients: [RecipeIngredient]
    public let steps: [RecipeStep]
    public let cost: RecipeCost?
}

public struct RecipeIngredient: Codable, Identifiable {
    public let id: String
    public let ingredientId: String
    public let ingredientName: String
    public let quantity: Decimal
    public let unit: String
    public let cost: Decimal?
    public let sectionId: String?
}

public struct RecipeStep: Codable, Identifiable {
    public let id: String
    public let sectionId: String?
    public let stepNumber: Int
    public let instruction: String
    public let temperature: Int?
    public let duration: Int?
    public let hasTimer: Bool
}

public struct RecipeCost: Codable {
    public let totalCost: Decimal
    public let costPerServing: Decimal?
    public let costPerSlice: Decimal?
    public let foodCostPercentage: Decimal?
}




