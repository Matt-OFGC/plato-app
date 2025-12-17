import Foundation

/// Temporary debugging utility to test login endpoint responses
/// This can help verify what the backend actually returns
struct LoginResponseDebugger {
    
    /// Test the login endpoint and print raw response
    static func testLoginEndpoint(email: String, password: String) async {
        print("\n=== LOGIN ENDPOINT DEBUG TEST ===")
        print("Testing: POST /api/login")
        print("Email: \(email)")
        print("================================\n")
        
        guard let url = URL(string: "http://127.0.0.1:3000/api/login") else {
            print("❌ Invalid URL")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        let body = ["email": email, "password": password, "rememberMe": true] as [String : Any]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Not an HTTP response")
                return
            }
            
            print("✅ Response received")
            print("\n--- STATUS ---")
            print("Status Code: \(httpResponse.statusCode)")
            
            print("\n--- HEADERS ---")
            for (key, value) in httpResponse.allHeaderFields {
                print("\(key): \(value)")
            }
            
            print("\n--- RESPONSE SIZE ---")
            print("Data size: \(data.count) bytes")
            
            print("\n--- RAW RESPONSE (String) ---")
            if let responseString = String(data: data, encoding: .utf8) {
                print(responseString)
            } else {
                print("❌ Response is not valid UTF-8")
                print("Hex dump: \(data.map { String(format: "%02x", $0) }.joined(separator: " "))")
            }
            
            print("\n--- JSON STRUCTURE ---")
            if let json = try? JSONSerialization.jsonObject(with: data) {
                if let dict = json as? [String: Any] {
                    print("Response is a Dictionary with keys:")
                    for (key, value) in dict {
                        let valueType = type(of: value)
                        print("  - \(key): \(valueType)")
                        
                        // Print nested structure for complex types
                        if let nestedDict = value as? [String: Any] {
                            print("    Nested keys: \(nestedDict.keys.joined(separator: ", "))")
                        }
                    }
                    
                    // Pretty print the JSON
                    print("\n--- PRETTY JSON ---")
                    if let prettyData = try? JSONSerialization.data(withJSONObject: json, options: .prettyPrinted),
                       let prettyString = String(data: prettyData, encoding: .utf8) {
                        print(prettyString)
                    }
                } else if let array = json as? [Any] {
                    print("Response is an Array with \(array.count) elements")
                } else {
                    print("Response JSON type: \(type(of: json))")
                }
            } else {
                print("❌ Response is not valid JSON")
            }
            
            print("\n--- DECODING TESTS ---")
            
            // Test 1: Try to decode as LoginResponse
            print("\n1. Testing LoginResponse decoding...")
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            
            do {
                let loginResponse = try decoder.decode(LoginResponse.self, from: data)
                print("✅ Successfully decoded as LoginResponse")
                print("   - success: \(loginResponse.success)")
                print("   - requiresMfa: \(loginResponse.requiresMfa ?? false)")
                print("   - message: \(loginResponse.message ?? "nil")")
                print("   - user: \(loginResponse.user != nil ? "present" : "nil")")
                print("   - company: \(loginResponse.company != nil ? "present" : "nil")")
            } catch let error as DecodingError {
                print("❌ Failed to decode as LoginResponse")
                switch error {
                case .keyNotFound(let key, let context):
                    print("   Missing key: \(key.stringValue)")
                    print("   Context: \(context.debugDescription)")
                case .typeMismatch(let type, let context):
                    print("   Type mismatch for: \(type)")
                    print("   Context: \(context.debugDescription)")
                    print("   Coding path: \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
                case .valueNotFound(let type, let context):
                    print("   Value not found for: \(type)")
                    print("   Context: \(context.debugDescription)")
                case .dataCorrupted(let context):
                    print("   Data corrupted")
                    print("   Context: \(context.debugDescription)")
                @unknown default:
                    print("   Unknown decoding error: \(error)")
                }
            } catch {
                print("❌ Other error: \(error)")
            }
            
            // Test 2: Try to decode as generic dictionary
            print("\n2. Testing generic dictionary decoding...")
            if let dict = try? decoder.decode([String: AnyCodable].self, from: data) {
                print("✅ Decoded as dictionary:")
                for (key, value) in dict {
                    print("   \(key) = \(value.value)")
                }
            }
            
            print("\n=== END DEBUG TEST ===\n")
            
        } catch {
            print("❌ Error during test: \(error)")
        }
    }
}

// Helper to decode any JSON value
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = "null"
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        default:
            try container.encodeNil()
        }
    }
}
