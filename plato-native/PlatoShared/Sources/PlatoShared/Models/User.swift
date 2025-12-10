import Foundation

/// User model matching the Prisma schema
public struct User: Decodable, Encodable, Identifiable {
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
    
    // Custom decoder to handle Int IDs from backend
    enum CodingKeys: String, CodingKey {
        case id, email, name, isAdmin, isActive, emailVerified, createdAt, updatedAt, lastLoginAt, companyId
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Handle ID as either Int or String
        // Try Int first (what backend sends), catch and try String if it fails
        do {
            let intId = try container.decode(Int.self, forKey: .id)
            self.id = String(intId)
        } catch {
            // If Int decoding fails, try String
            self.id = try container.decode(String.self, forKey: .id)
        }
        
        self.email = try container.decode(String.self, forKey: .email)
        self.name = try container.decodeIfPresent(String.self, forKey: .name)
        self.isAdmin = try container.decodeIfPresent(Bool.self, forKey: .isAdmin) ?? false
        self.isActive = try container.decodeIfPresent(Bool.self, forKey: .isActive) ?? true
        self.emailVerified = try container.decodeIfPresent(Bool.self, forKey: .emailVerified)
        
        // Handle dates - they might be missing in some responses
        if let createdAt = try? container.decode(Date.self, forKey: .createdAt) {
            self.createdAt = createdAt
        } else {
            self.createdAt = Date() // Default to now if missing
        }
        
        if let updatedAt = try? container.decode(Date.self, forKey: .updatedAt) {
            self.updatedAt = updatedAt
        } else {
            self.updatedAt = Date() // Default to now if missing
        }
        
        self.lastLoginAt = try container.decodeIfPresent(Date.self, forKey: .lastLoginAt)
        
        // Handle companyId as either Int or String
        if let intCompanyId = try? container.decode(Int.self, forKey: .companyId) {
            self.companyId = String(intCompanyId)
        } else {
            self.companyId = try container.decodeIfPresent(String.self, forKey: .companyId)
        }
    }
    
    // Custom encoder
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(email, forKey: .email)
        try container.encodeIfPresent(name, forKey: .name)
        try container.encode(isAdmin, forKey: .isAdmin)
        try container.encode(isActive, forKey: .isActive)
        try container.encodeIfPresent(emailVerified, forKey: .emailVerified)
        try container.encode(createdAt, forKey: .createdAt)
        try container.encode(updatedAt, forKey: .updatedAt)
        try container.encodeIfPresent(lastLoginAt, forKey: .lastLoginAt)
        try container.encodeIfPresent(companyId, forKey: .companyId)
    }
}





