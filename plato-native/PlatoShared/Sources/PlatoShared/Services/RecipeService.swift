import Foundation

/// Service for recipe-related API operations
public class RecipeService {
    public static let shared = RecipeService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    /// Get all recipes (with optional full data)
    public func getRecipes(full: Bool = false) async throws -> [APIRecipeResponse] {
        let endpoint = full ? "\(APIEndpoint.recipes.path)?full=true" : APIEndpoint.recipes.path
        return try await apiClient.get(
            endpoint: endpoint,
            responseType: [APIRecipeResponse].self
        )
    }
    
    /// Get a single recipe by ID
    public func getRecipe(id: String) async throws -> APIRecipeResponse {
        return try await apiClient.get(
            endpoint: APIEndpoint.recipe(id: id).path,
            responseType: APIRecipeResponse.self
        )
    }
    
    /// Create a new recipe
    public func createRecipe(_ recipe: CreateRecipeRequest) async throws -> CreateRecipeResponse {
        return try await apiClient.post(
            endpoint: APIEndpoint.recipes.path,
            body: recipe,
            responseType: CreateRecipeResponse.self
        )
    }
    
    /// Update an existing recipe
    public func updateRecipe(id: String, _ recipe: UpdateRecipeRequest) async throws -> EmptyResponse {
        return try await apiClient.put(
            endpoint: APIEndpoint.recipe(id: id).path,
            body: recipe,
            responseType: EmptyResponse.self
        )
    }
    
    /// Delete a recipe
    public func deleteRecipe(id: String) async throws {
        _ = try await apiClient.delete(
            endpoint: APIEndpoint.recipe(id: id).path,
            responseType: EmptyResponse.self
        )
    }
    
    /// Bulk delete recipes
    public func bulkDelete(ids: [String]) async throws {
        let request = BulkDeleteRequest(ids: ids)
        _ = try await apiClient.post(
            endpoint: APIEndpoint.recipeBulkDelete.path,
            body: request,
            responseType: EmptyResponse.self
        )
    }
}

// MARK: - Request Models

public struct CreateRecipeRequest: Encodable {
    public let name: String
    public let description: String?
    public let category: String?
    public let yieldQuantity: String
    public let yieldUnit: String?
    public let sellingPrice: String?
    public let storage: String?
    public let shelfLife: String?
    public let imageUrl: String?
    public let ingredients: [RecipeIngredientRequest]?
    public let steps: [RecipeStepRequest]?
    
    public init(
        name: String,
        description: String? = nil,
        category: String? = nil,
        yieldQuantity: String,
        yieldUnit: String? = "each",
        sellingPrice: String? = nil,
        storage: String? = nil,
        shelfLife: String? = nil,
        imageUrl: String? = nil,
        ingredients: [RecipeIngredientRequest]? = nil,
        steps: [RecipeStepRequest]? = nil
    ) {
        self.name = name
        self.description = description
        self.category = category
        self.yieldQuantity = yieldQuantity
        self.yieldUnit = yieldUnit
        self.sellingPrice = sellingPrice
        self.storage = storage
        self.shelfLife = shelfLife
        self.imageUrl = imageUrl
        self.ingredients = ingredients
        self.steps = steps
    }
}

public struct UpdateRecipeRequest: Encodable {
    public let name: String?
    public let description: String?
    public let category: String?
    public let yieldQuantity: String?
    public let yieldUnit: String?
    public let sellingPrice: String?
    public let storage: String?
    public let shelfLife: String?
    public let imageUrl: String?
    public let ingredients: [RecipeIngredientRequest]?
    public let steps: [RecipeStepRequest]?
    
    public init(
        name: String? = nil,
        description: String? = nil,
        category: String? = nil,
        yieldQuantity: String? = nil,
        yieldUnit: String? = nil,
        sellingPrice: String? = nil,
        storage: String? = nil,
        shelfLife: String? = nil,
        imageUrl: String? = nil,
        ingredients: [RecipeIngredientRequest]? = nil,
        steps: [RecipeStepRequest]? = nil
    ) {
        self.name = name
        self.description = description
        self.category = category
        self.yieldQuantity = yieldQuantity
        self.yieldUnit = yieldUnit
        self.sellingPrice = sellingPrice
        self.storage = storage
        self.shelfLife = shelfLife
        self.imageUrl = imageUrl
        self.ingredients = ingredients
        self.steps = steps
    }
}

public struct RecipeIngredientRequest: Encodable {
    public var id: String
    public var name: String
    public var quantity: String
    public var unit: String
    public var stepId: String?
    
    public init(id: String, name: String, quantity: String, unit: String, stepId: String? = nil) {
        self.id = id
        self.name = name
        self.quantity = quantity
        self.unit = unit
        self.stepId = stepId
    }
}

public struct RecipeStepRequest: Encodable {
    public var id: String
    public var title: String
    public var method: String?
    public var instructions: [String]?
    public var temperatureC: Int?
    public var durationMin: Int?
    
    public init(id: String, title: String, method: String? = nil, instructions: [String]? = nil, temperatureC: Int? = nil, durationMin: Int? = nil) {
        self.id = id
        self.title = title
        self.method = method
        self.instructions = instructions
        self.temperatureC = temperatureC
        self.durationMin = durationMin
    }
}

public struct CreateRecipeResponse: Decodable {
    public let success: Bool
    public let recipeId: Int
}

struct BulkDeleteRequest: Encodable {
    let ids: [String]
}

