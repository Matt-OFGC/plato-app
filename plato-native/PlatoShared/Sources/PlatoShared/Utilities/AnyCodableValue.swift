import Foundation

/// Helper to decode values that could be multiple types
struct AnyCodableValue: Decodable {
    let value: Any
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let intValue = try? container.decode(Int.self) {
            value = intValue
        } else if let stringValue = try? container.decode(String.self) {
            value = stringValue
        } else if let doubleValue = try? container.decode(Double.self) {
            value = doubleValue
        } else if let boolValue = try? container.decode(Bool.self) {
            value = boolValue
        } else {
            throw DecodingError.typeMismatch(Any.self, DecodingError.Context(
                codingPath: decoder.codingPath,
                debugDescription: "Unsupported type"
            ))
        }
    }
}




