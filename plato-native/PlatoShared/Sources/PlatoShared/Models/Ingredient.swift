import Foundation

/// Ingredient model matching the Prisma schema
public struct Ingredient: Codable, Identifiable {
    public let id: String
    public let name: String
    public let description: String?
    public let categoryId: String?
    public let supplierId: String?
    public let companyId: String
    public let unit: String // "g", "kg", "ml", "l", "each", etc.
    public let purchaseUnit: String?
    public let purchasePrice: Decimal?
    public let purchaseQuantity: Decimal?
    public let costPerUnit: Decimal?
    public let density: Decimal? // For volume to weight conversion
    public let createdAt: Date
    public let updatedAt: Date
    
    public init(
        id: String,
        name: String,
        description: String? = nil,
        categoryId: String? = nil,
        supplierId: String? = nil,
        companyId: String,
        unit: String,
        purchaseUnit: String? = nil,
        purchasePrice: Decimal? = nil,
        purchaseQuantity: Decimal? = nil,
        costPerUnit: Decimal? = nil,
        density: Decimal? = nil,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.categoryId = categoryId
        self.supplierId = supplierId
        self.companyId = companyId
        self.unit = unit
        self.purchaseUnit = purchaseUnit
        self.purchasePrice = purchasePrice
        self.purchaseQuantity = purchaseQuantity
        self.costPerUnit = costPerUnit
        self.density = density
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}






