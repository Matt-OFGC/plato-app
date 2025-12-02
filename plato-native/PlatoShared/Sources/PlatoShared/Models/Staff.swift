import Foundation

/// Staff member model matching the Prisma schema
public struct Staff: Codable, Identifiable {
    public let id: String
    public let userId: String?
    public let companyId: String
    public let name: String
    public let email: String?
    public let phone: String?
    public let role: String?
    public let pin: String?
    public let isActive: Bool
    public let createdAt: Date
    public let updatedAt: Date
    
    public init(
        id: String,
        userId: String? = nil,
        companyId: String,
        name: String,
        email: String? = nil,
        phone: String? = nil,
        role: String? = nil,
        pin: String? = nil,
        isActive: Bool = true,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.userId = userId
        self.companyId = companyId
        self.name = name
        self.email = email
        self.phone = phone
        self.role = role
        self.pin = pin
        self.isActive = isActive
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}




