import Foundation

/// Company model matching the Prisma schema
public struct Company: Decodable, Encodable, Identifiable {
    public let id: String
    public let name: String
    public let slug: String?
    public let logoUrl: String?
    public let businessType: String?
    public let country: String?
    public let phone: String?
    public let createdAt: Date?
    public let updatedAt: Date?
    
    public init(
        id: String,
        name: String,
        slug: String? = nil,
        logoUrl: String? = nil,
        businessType: String? = nil,
        country: String? = nil,
        phone: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.slug = slug
        self.logoUrl = logoUrl
        self.businessType = businessType
        self.country = country
        self.phone = phone
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Custom decoder to handle Int IDs from backend
    enum CodingKeys: String, CodingKey {
        case id, name, slug, logoUrl, businessType, country, phone, createdAt, updatedAt
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
        
        self.name = try container.decode(String.self, forKey: .name)
        self.slug = try container.decodeIfPresent(String.self, forKey: .slug)
        self.logoUrl = try container.decodeIfPresent(String.self, forKey: .logoUrl)
        self.businessType = try container.decodeIfPresent(String.self, forKey: .businessType)
        self.country = try container.decodeIfPresent(String.self, forKey: .country)
        self.phone = try container.decodeIfPresent(String.self, forKey: .phone)
        self.createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        self.updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt)
    }
    
    // Custom encoder
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(slug, forKey: .slug)
        try container.encodeIfPresent(logoUrl, forKey: .logoUrl)
        try container.encodeIfPresent(businessType, forKey: .businessType)
        try container.encodeIfPresent(country, forKey: .country)
        try container.encodeIfPresent(phone, forKey: .phone)
        try container.encodeIfPresent(createdAt, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt, forKey: .updatedAt)
    }
}





