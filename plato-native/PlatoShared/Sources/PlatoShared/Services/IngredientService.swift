import Foundation

/// Service for ingredient-related API operations
public class IngredientService {
    public static let shared = IngredientService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    /// Get all ingredients
    public func getIngredients() async throws -> [Ingredient] {
        return try await apiClient.get(
            endpoint: APIEndpoint.ingredients.path,
            responseType: [Ingredient].self
        )
    }
    
    /// Get a single ingredient by ID
    public func getIngredient(id: String) async throws -> Ingredient {
        return try await apiClient.get(
            endpoint: APIEndpoint.ingredient(id: id).path,
            responseType: Ingredient.self
        )
    }
    
    /// Create a new ingredient
    public func createIngredient(_ ingredient: CreateIngredientRequest) async throws -> Ingredient {
        return try await apiClient.post(
            endpoint: APIEndpoint.ingredients.path,
            body: ingredient,
            responseType: Ingredient.self
        )
    }
    
    /// Update an existing ingredient
    public func updateIngredient(id: String, _ ingredient: UpdateIngredientRequest) async throws -> Ingredient {
        return try await apiClient.put(
            endpoint: APIEndpoint.ingredient(id: id).path,
            body: ingredient,
            responseType: Ingredient.self
        )
    }
    
    /// Delete an ingredient
    public func deleteIngredient(id: String) async throws {
        _ = try await apiClient.delete(
            endpoint: APIEndpoint.ingredient(id: id).path,
            responseType: EmptyResponse.self
        )
    }
    
    /// Bulk delete ingredients
    public func bulkDelete(ids: [String]) async throws {
        let request = BulkDeleteRequest(ids: ids)
        _ = try await apiClient.post(
            endpoint: APIEndpoint.ingredientBulkDelete.path,
            body: request,
            responseType: EmptyResponse.self
        )
    }
}

// MARK: - Request Models

public struct CreateIngredientRequest: Encodable {
    public let name: String
    public let description: String?
    public let categoryId: String?
    public let supplierId: String?
    public let unit: String
    public let purchaseUnit: String?
    public let purchasePrice: Decimal?
    public let purchaseQuantity: Decimal?
    public let density: Decimal?
    
    public init(
        name: String,
        description: String? = nil,
        categoryId: String? = nil,
        supplierId: String? = nil,
        unit: String,
        purchaseUnit: String? = nil,
        purchasePrice: Decimal? = nil,
        purchaseQuantity: Decimal? = nil,
        density: Decimal? = nil
    ) {
        self.name = name
        self.description = description
        self.categoryId = categoryId
        self.supplierId = supplierId
        self.unit = unit
        self.purchaseUnit = purchaseUnit
        self.purchasePrice = purchasePrice
        self.purchaseQuantity = purchaseQuantity
        self.density = density
    }
}

public struct UpdateIngredientRequest: Encodable {
    public let name: String?
    public let description: String?
    public let categoryId: String?
    public let supplierId: String?
    public let unit: String?
    public let purchaseUnit: String?
    public let purchasePrice: Decimal?
    public let purchaseQuantity: Decimal?
    public let density: Decimal?
    
    public init(
        name: String? = nil,
        description: String? = nil,
        categoryId: String? = nil,
        supplierId: String? = nil,
        unit: String? = nil,
        purchaseUnit: String? = nil,
        purchasePrice: Decimal? = nil,
        purchaseQuantity: Decimal? = nil,
        density: Decimal? = nil
    ) {
        self.name = name
        self.description = description
        self.categoryId = categoryId
        self.supplierId = supplierId
        self.unit = unit
        self.purchaseUnit = purchaseUnit
        self.purchasePrice = purchasePrice
        self.purchaseQuantity = purchaseQuantity
        self.density = density
    }
}

