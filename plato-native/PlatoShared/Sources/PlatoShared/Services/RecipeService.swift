import Foundation

/// Service for recipe-related API operations
public class RecipeService {
    public static let shared = RecipeService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    /// Get all recipes
    public func getRecipes() async throws -> [Recipe] {
        return try await apiClient.get(
            endpoint: APIEndpoint.recipes.path,
            responseType: [Recipe].self
        )
    }
    
    /// Get a single recipe by ID
    public func getRecipe(id: String) async throws -> RecipeDetail {
        return try await apiClient.get(
            endpoint: APIEndpoint.recipe(id: id).path,
            responseType: RecipeDetail.self
        )
    }
    
    /// Create a new recipe
    public func createRecipe(_ recipe: CreateRecipeRequest) async throws -> Recipe {
        return try await apiClient.post(
            endpoint: APIEndpoint.recipes.path,
            body: recipe,
            responseType: Recipe.self
        )
    }
    
    /// Update an existing recipe
    public func updateRecipe(id: String, _ recipe: UpdateRecipeRequest) async throws -> Recipe {
        return try await apiClient.put(
            endpoint: APIEndpoint.recipe(id: id).path,
            body: recipe,
            responseType: Recipe.self
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
    public let categoryId: String?
    public let servings: Int?
    public let prepTime: Int?
    public let cookTime: Int?
    public let recipeType: String?
    public let batchSize: Int?
    public let isProtected: Bool
    
    public init(
        name: String,
        description: String? = nil,
        categoryId: String? = nil,
        servings: Int? = nil,
        prepTime: Int? = nil,
        cookTime: Int? = nil,
        recipeType: String? = nil,
        batchSize: Int? = nil,
        isProtected: Bool = false
    ) {
        self.name = name
        self.description = description
        self.categoryId = categoryId
        self.servings = servings
        self.prepTime = prepTime
        self.cookTime = cookTime
        self.recipeType = recipeType
        self.batchSize = batchSize
        self.isProtected = isProtected
    }
}

public struct UpdateRecipeRequest: Encodable {
    public let name: String?
    public let description: String?
    public let categoryId: String?
    public let servings: Int?
    public let prepTime: Int?
    public let cookTime: Int?
    public let recipeType: String?
    public let batchSize: Int?
    public let isProtected: Bool?
    
    public init(
        name: String? = nil,
        description: String? = nil,
        categoryId: String? = nil,
        servings: Int? = nil,
        prepTime: Int? = nil,
        cookTime: Int? = nil,
        recipeType: String? = nil,
        batchSize: Int? = nil,
        isProtected: Bool? = nil
    ) {
        self.name = name
        self.description = description
        self.categoryId = categoryId
        self.servings = servings
        self.prepTime = prepTime
        self.cookTime = cookTime
        self.recipeType = recipeType
        self.batchSize = batchSize
        self.isProtected = isProtected
    }
}

struct BulkDeleteRequest: Encodable {
    let ids: [String]
}

