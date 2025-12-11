import Foundation

/// Category model matching the Prisma schema
public struct Category: Codable, Identifiable {
    public let id: String
    public let name: String
    public let companyId: String
    public let displayOrder: Int?
    public let createdAt: Date
    public let updatedAt: Date
    
    public init(
        id: String,
        name: String,
        companyId: String,
        displayOrder: Int? = nil,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.name = name
        self.companyId = companyId
        self.displayOrder = displayOrder
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}








