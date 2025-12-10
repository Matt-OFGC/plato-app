import Foundation

/// Supplier model matching the Prisma schema
public struct Supplier: Codable, Identifiable {
    public let id: String
    public let name: String
    public let contactName: String?
    public let email: String?
    public let phone: String?
    public let address: String?
    public let companyId: String
    public let createdAt: Date
    public let updatedAt: Date
    
    public init(
        id: String,
        name: String,
        contactName: String? = nil,
        email: String? = nil,
        phone: String? = nil,
        address: String? = nil,
        companyId: String,
        createdAt: Date,
        updatedAt: Date
    ) {
        self.id = id
        self.name = name
        self.contactName = contactName
        self.email = email
        self.phone = phone
        self.address = address
        self.companyId = companyId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}






