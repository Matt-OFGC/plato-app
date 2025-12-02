import Foundation

/// Company model matching the Prisma schema
public struct Company: Codable, Identifiable {
    public let id: String
    public let name: String
    public let slug: String
    public let logoUrl: String?
    public let createdAt: Date
    public let updatedAt: Date
    
    public init(
        id: String,
        name: String,
        slug: String,
        logoUrl: String? = nil,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.name = name
        self.slug = slug
        self.logoUrl = logoUrl
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}




