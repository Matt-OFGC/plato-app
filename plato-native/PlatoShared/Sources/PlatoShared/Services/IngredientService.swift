import Foundation

/// Service for ingredient-related API operations
public class IngredientService {
    public static let shared = IngredientService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    /// Get all ingredients
    public func getIngredients() async throws -> [APIIngredientResponse] {
        return try await apiClient.get(
            endpoint: APIEndpoint.ingredients.path,
            responseType: [APIIngredientResponse].self
        )
    }
    
    /// Get a single ingredient by ID
    public func getIngredient(id: String) async throws -> APIIngredientResponse {
        return try await apiClient.get(
            endpoint: APIEndpoint.ingredient(id: id).path,
            responseType: APIIngredientResponse.self
        )
    }
    
    /// Create a new ingredient
    public func createIngredient(_ ingredient: CreateIngredientRequest) async throws -> CreateIngredientResponse {
        return try await apiClient.post(
            endpoint: APIEndpoint.ingredients.path,
            body: ingredient,
            responseType: CreateIngredientResponse.self
        )
    }
    
    /// Update an existing ingredient
    public func updateIngredient(id: String, _ ingredient: UpdateIngredientRequest) async throws -> EmptyResponse {
        return try await apiClient.put(
            endpoint: APIEndpoint.ingredient(id: id).path,
            body: ingredient,
            responseType: EmptyResponse.self
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
    public let supplier: String?
    public let supplierId: String?
    public let packQuantity: String
    public let packUnit: String
    public let packPrice: String
    public let currency: String?
    public let densityGPerMl: String?
    public let allergens: [String]?
    public let notes: String?
    
    public init(
        name: String,
        supplier: String? = nil,
        supplierId: String? = nil,
        packQuantity: String,
        packUnit: String,
        packPrice: String,
        currency: String? = "GBP",
        densityGPerMl: String? = nil,
        allergens: [String]? = nil,
        notes: String? = nil
    ) {
        self.name = name
        self.supplier = supplier
        self.supplierId = supplierId
        self.packQuantity = packQuantity
        self.packUnit = packUnit
        self.packPrice = packPrice
        self.currency = currency
        self.densityGPerMl = densityGPerMl
        self.allergens = allergens
        self.notes = notes
    }
}

public struct UpdateIngredientRequest: Encodable {
    public let name: String?
    public let supplier: String?
    public let supplierId: String?
    public let packQuantity: String?
    public let packUnit: String?
    public let packPrice: String?
    public let currency: String?
    public let densityGPerMl: String?
    public let allergens: [String]?
    public let notes: String?
    
    public init(
        name: String? = nil,
        supplier: String? = nil,
        supplierId: String? = nil,
        packQuantity: String? = nil,
        packUnit: String? = nil,
        packPrice: String? = nil,
        currency: String? = nil,
        densityGPerMl: String? = nil,
        allergens: [String]? = nil,
        notes: String? = nil
    ) {
        self.name = name
        self.supplier = supplier
        self.supplierId = supplierId
        self.packQuantity = packQuantity
        self.packUnit = packUnit
        self.packPrice = packPrice
        self.currency = currency
        self.densityGPerMl = densityGPerMl
        self.allergens = allergens
        self.notes = notes
    }
}

// MARK: - API Response Models

public struct APIIngredientResponse: Decodable, Identifiable {
    public let id: Int
    public let name: String
    public let supplier: String?
    public let supplierId: Int?
    public let packQuantity: String
    public let packUnit: String
    public let originalUnit: String
    public let packPrice: String
    public let currency: String
    public let densityGPerMl: String?
    public let allergens: [String]
    public let notes: String?
    public let createdAt: String
    public let updatedAt: String
    public let supplierRef: SupplierRef?
    
    public struct SupplierRef: Decodable {
        public let id: Int
        public let name: String
    }
    
    enum CodingKeys: String, CodingKey {
        case id, name, supplier, supplierId, packQuantity, packUnit, originalUnit, packPrice, currency, densityGPerMl, allergens, notes, createdAt, updatedAt, supplierRef
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
        
        self.name = try container.decode(String.self, forKey: .name)
        self.supplier = try container.decodeIfPresent(String.self, forKey: .supplier)
        
        if let intSupplierId = try? container.decode(Int.self, forKey: .supplierId) {
            self.supplierId = intSupplierId
        } else {
            self.supplierId = try container.decodeIfPresent(String.self, forKey: .supplierId).flatMap { Int($0) }
        }
        
        self.packQuantity = try container.decode(String.self, forKey: .packQuantity)
        self.packUnit = try container.decode(String.self, forKey: .packUnit)
        self.originalUnit = try container.decodeIfPresent(String.self, forKey: .originalUnit) ?? self.packUnit
        self.packPrice = try container.decode(String.self, forKey: .packPrice)
        self.currency = try container.decodeIfPresent(String.self, forKey: .currency) ?? "GBP"
        self.densityGPerMl = try container.decodeIfPresent(String.self, forKey: .densityGPerMl)
        self.allergens = try container.decodeIfPresent([String].self, forKey: .allergens) ?? []
        self.notes = try container.decodeIfPresent(String.self, forKey: .notes)
        self.createdAt = try container.decode(String.self, forKey: .createdAt)
        self.updatedAt = try container.decode(String.self, forKey: .updatedAt)
        self.supplierRef = try container.decodeIfPresent(SupplierRef.self, forKey: .supplierRef)
    }
}

public struct CreateIngredientResponse: Decodable {
    public let success: Bool
    public let ingredient: IngredientInfo?
    
    public struct IngredientInfo: Decodable {
        public let id: Int
        public let name: String
        public let packQuantity: String
        public let packUnit: String
        public let packPrice: String
    }
}

