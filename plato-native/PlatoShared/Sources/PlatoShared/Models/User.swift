import Foundation

/// User model matching the Prisma schema
public struct User: Codable, Identifiable {
    public let id: String
    public let email: String
    public let name: String?
    public let isAdmin: Bool
    public let isActive: Bool
    public let emailVerified: Bool?
    public let createdAt: Date
    public let updatedAt: Date
    public let lastLoginAt: Date?
    public let companyId: String?
    
    public init(
        id: String,
        email: String,
        name: String? = nil,
        isAdmin: Bool = false,
        isActive: Bool = true,
        emailVerified: Bool? = nil,
        createdAt: Date,
        updatedAt: Date,
        lastLoginAt: Date? = nil,
        companyId: String? = nil
    ) {
        self.id = id
        self.email = email
        self.name = name
        self.isAdmin = isAdmin
        self.isActive = isActive
        self.emailVerified = emailVerified
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.lastLoginAt = lastLoginAt
        self.companyId = companyId
    }
}





