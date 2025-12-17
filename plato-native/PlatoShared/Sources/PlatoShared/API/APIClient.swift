import Foundation

/// Base API client for communicating with the Next.js backend
public class APIClient {
    public static let shared = APIClient()
    
    private let baseURL: String
    private let session: URLSession
    private let cookieStorage: HTTPCookieStorage
    
    private init() {
        // Get base URL from environment or use default
        // In production, this should be your deployed Next.js URL
        // For iOS simulator, use 127.0.0.1 instead of localhost
        let defaultURL = ProcessInfo.processInfo.environment["PLATO_API_URL"] ?? "http://127.0.0.1:3000"
        // Replace localhost with 127.0.0.1 for simulator compatibility
        self.baseURL = defaultURL.replacingOccurrences(of: "localhost", with: "127.0.0.1")
        
        // Configure cookie storage to persist sessions
        self.cookieStorage = HTTPCookieStorage.shared
        self.cookieStorage.cookieAcceptPolicy = .always
        
        // Configure URL session with cookie support and timeout
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = cookieStorage
        configuration.httpShouldSetCookies = true
        configuration.httpCookieAcceptPolicy = .always
        configuration.timeoutIntervalForRequest = 30 // 30 second timeout
        configuration.timeoutIntervalForResource = 60 // 60 second resource timeout
        // URLSession automatically handles gzip/deflate decompression and chunked encoding
        configuration.requestCachePolicy = .useProtocolCachePolicy
        // Ensure we can handle chunked transfer encoding
        configuration.httpShouldUsePipelining = false
        
        self.session = URLSession(configuration: configuration)
    }
    
    /// Make a GET request
    public func get<T: Decodable>(
        endpoint: String,
        responseType: T.Type
    ) async throws -> T {
        return try await requestWithoutBody(method: "GET", endpoint: endpoint, responseType: responseType)
    }
    
    /// Make a POST request
    public func post<T: Decodable, B: Encodable>(
        endpoint: String,
        body: B?,
        responseType: T.Type
    ) async throws -> T {
        return try await request(method: "POST", endpoint: endpoint, body: body, responseType: responseType)
    }
    
    /// Make a PUT request
    public func put<T: Decodable, B: Encodable>(
        endpoint: String,
        body: B?,
        responseType: T.Type
    ) async throws -> T {
        return try await request(method: "PUT", endpoint: endpoint, body: body, responseType: responseType)
    }
    
    /// Make a DELETE request
    public func delete<T: Decodable>(
        endpoint: String,
        responseType: T.Type
    ) async throws -> T {
        return try await requestWithoutBody(method: "DELETE", endpoint: endpoint, responseType: responseType)
    }
    
    /// Generic request method without body
    private func requestWithoutBody<T: Decodable>(
        method: String,
        endpoint: String,
        responseType: T.Type
    ) async throws -> T {
        return try await performRequest(method: method, endpoint: endpoint, bodyData: nil, responseType: responseType)
    }
    
    /// Generic request method
    private func request<T: Decodable, B: Encodable>(
        method: String,
        endpoint: String,
        body: B?,
        responseType: T.Type
    ) async throws -> T {
        var bodyData: Data? = nil
        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            bodyData = try encoder.encode(body)
        }
        return try await performRequest(method: method, endpoint: endpoint, bodyData: bodyData, responseType: responseType)
    }
    
    /// Perform the actual HTTP request
    private func performRequest<T: Decodable>(
        method: String,
        endpoint: String,
        bodyData: Data?,
        responseType: T.Type
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        // Explicitly don't accept compression to avoid -1015 errors
        // URLSession can have issues with mismatched Content-Encoding headers
        request.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
        
        // Add cookies from storage
        if let cookies = cookieStorage.cookies(for: url) {
            let cookieHeader = HTTPCookie.requestHeaderFields(with: cookies)
            request.allHTTPHeaderFields?.merge(cookieHeader) { (_, new) in new }
        }
        
        // Add request body if provided
        if let bodyData = bodyData {
            request.httpBody = bodyData
        }
        
        // Perform request with better error handling
        let (data, response): (Data, URLResponse)
        do {
            print("📤 Making request to: \(url.absoluteString)")
            print("📤 Request headers: \(request.allHTTPHeaderFields ?? [:])")
            (data, response) = try await session.data(for: request)
            print("✅ Received response, data size: \(data.count) bytes")
        } catch let error as URLError {
            print("❌ URLError for \(url.absoluteString):")
            print("   Code: \(error.code.rawValue) (\(error.code))")
            print("   Description: \(error.localizedDescription)")
            print("   Failure URL: \(error.failureURLString ?? "none")")
            throw APIError.decodingError(error)
        } catch {
            print("❌ Unknown error for \(url.absoluteString): \(error)")
            print("   Type: \(type(of: error))")
            print("   Description: \(error.localizedDescription)")
            throw APIError.decodingError(error)
        }
        
        // Check HTTP status
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        // Debug: Print response info
        print("=== API Response Debug ===")
        print("URL: \(url.absoluteString)")
        print("Method: \(method)")
        print("Response status: \(httpResponse.statusCode)")
        print("Response headers:")
        for (key, value) in httpResponse.allHeaderFields {
            print("  \(key): \(value)")
        }
        print("Content-Type: \(httpResponse.value(forHTTPHeaderField: "Content-Type") ?? "unknown")")
        print("Content-Encoding: \(httpResponse.value(forHTTPHeaderField: "Content-Encoding") ?? "none")")
        print("Transfer-Encoding: \(httpResponse.value(forHTTPHeaderField: "Transfer-Encoding") ?? "none")")
        print("Content-Length: \(httpResponse.value(forHTTPHeaderField: "Content-Length") ?? "none")")
        print("Data length: \(data.count) bytes")
        print("==========================")
        
        // Store cookies from response
        let cookieHeaders = httpResponse.allHeaderFields as? [String: String] ?? [:]
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: cookieHeaders, for: url)
        if !cookies.isEmpty {
            cookieStorage.setCookies(cookies, for: url, mainDocumentURL: nil)
        }
        
        // Handle errors
        guard (200...299).contains(httpResponse.statusCode) else {
            let errorMessage = try? JSONDecoder().decode(APIErrorResponse.self, from: data)
            let responseString = String(data: data, encoding: .utf8) ?? "Unable to decode response"
            print("Error response: \(responseString)")
            throw APIError.httpError(statusCode: httpResponse.statusCode, message: errorMessage?.error ?? "Unknown error")
        }
        
        // Try to decode response as string first for debugging
        if let responseString = String(data: data, encoding: .utf8) {
            print("Response preview (first 500 chars): \(String(responseString.prefix(500)))")
            print("Full URL: \(url.absoluteString)")
            
            // Check if response looks like an error or wrong format
            if responseString.contains("\"error\"") {
                print("⚠️ Response contains error field - might be an error response")
            }
            if responseString.contains("\"user\"") && responseString.contains("\"company\"") {
                print("⚠️ Response looks like session data, not recipes!")
            }
        }
        
        // Decode response
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        // Check if data is empty
        guard !data.isEmpty else {
            print("⚠️ Empty response data received")
            throw APIError.decodingError(NSError(domain: "APIClient", code: -1, userInfo: [NSLocalizedDescriptionKey: "Empty response"]))
        }
        
        do {
            // Try to decode as generic JSON first to see structure
            if let jsonObject = try? JSONSerialization.jsonObject(with: data) {
                print("Response JSON structure: \(type(of: jsonObject))")
                if let dict = jsonObject as? [String: Any] {
                    print("Response keys: \(dict.keys.joined(separator: ", "))")
                    print("Response values preview:")
                    for (key, value) in dict {
                        print("  \(key): \(type(of: value)) = \(value)")
                    }
                }
            }
            
            return try decoder.decode(responseType, from: data)
        } catch DecodingError.keyNotFound(let key, let context) {
            print("❌ Decoding error: Missing key '\(key.stringValue)'")
            print("   Expected type: \(responseType)")
            print("   Context path: \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
            print("   Debug description: \(context.debugDescription)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("   Full response data: \(responseString)")
            }
            throw APIError.decodingError(DecodingError.keyNotFound(key, context))
        } catch DecodingError.typeMismatch(let type, let context) {
            print("❌ Decoding error: Type mismatch for type '\(type)'")
            print("   Expected type: \(responseType)")
            print("   Context path: \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
            print("   Debug description: \(context.debugDescription)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("   Full response data: \(responseString)")
            }
            throw APIError.decodingError(DecodingError.typeMismatch(type, context))
        } catch DecodingError.valueNotFound(let type, let context) {
            print("❌ Decoding error: Value not found for type '\(type)'")
            print("   Expected type: \(responseType)")
            print("   Context path: \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
            print("   Debug description: \(context.debugDescription)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("   Full response data: \(responseString)")
            }
            throw APIError.decodingError(DecodingError.valueNotFound(type, context))
        } catch DecodingError.dataCorrupted(let context) {
            print("❌ Decoding error: Data corrupted")
            print("   Expected type: \(responseType)")
            print("   Context path: \(context.codingPath.map { $0.stringValue }.joined(separator: "."))")
            print("   Debug description: \(context.debugDescription)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("   Full response data: \(responseString)")
            }
            throw APIError.decodingError(DecodingError.dataCorrupted(context))
        } catch {
            print("❌ Decoding error: \(error)")
            print("   Error type: \(type(of: error))")
            print("   Expected type: \(responseType)")
            if let responseString = String(data: data, encoding: .utf8) {
                print("   Full response data: \(responseString)")
            } else {
                print("   Response data is not valid UTF-8")
                print("   First 100 bytes: \(data.prefix(100).map { String(format: "%02x", $0) }.joined(separator: " "))")
            }
            throw APIError.decodingError(error)
        }
    }
    
    /// Clear all cookies (for logout)
    public func clearCookies() {
        if let cookies = cookieStorage.cookies {
            for cookie in cookies {
                cookieStorage.deleteCookie(cookie)
            }
        }
    }
}

// MARK: - Error Types

public enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String)
    case decodingError(Error)
    case encodingError(Error)
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let statusCode, let message):
            return "HTTP \(statusCode): \(message)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        }
    }
}

struct APIErrorResponse: Decodable {
    let error: String
}





