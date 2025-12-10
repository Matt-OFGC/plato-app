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
        self.baseURL = ProcessInfo.processInfo.environment["PLATO_API_URL"] ?? "http://localhost:3000"
        
        // Configure cookie storage to persist sessions
        self.cookieStorage = HTTPCookieStorage.shared
        self.cookieStorage.cookieAcceptPolicy = .always
        
        // Configure URL session with cookie support
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = cookieStorage
        configuration.httpShouldSetCookies = true
        configuration.httpCookieAcceptPolicy = .always
        
        self.session = URLSession(configuration: configuration)
    }
    
    /// Make a GET request
    public func get<T: Decodable>(
        endpoint: String,
        responseType: T.Type
    ) async throws -> T {
        return try await request(method: "GET", endpoint: endpoint, body: nil, responseType: responseType)
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
        return try await request(method: "DELETE", endpoint: endpoint, body: nil, responseType: responseType)
    }
    
    /// Generic request method
    private func request<T: Decodable, B: Encodable>(
        method: String,
        endpoint: String,
        body: B?,
        responseType: T.Type
    ) async throws -> T {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Add cookies from storage
        if let cookies = cookieStorage.cookies(for: url) {
            let cookieHeader = HTTPCookie.requestHeaderFields(with: cookies)
            request.allHTTPHeaderFields?.merge(cookieHeader) { (_, new) in new }
        }
        
        // Add request body if provided
        if let body = body {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            request.httpBody = try encoder.encode(body)
        }
        
        // Perform request
        let (data, response) = try await session.data(for: request)
        
        // Check HTTP status
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        // Store cookies from response
        if let cookies = HTTPCookie.cookies(withResponseHeaderFields: httpResponse.allHeaderFields as! [String: String], for: url) {
            cookieStorage.setCookies(cookies, for: url, mainDocumentURL: nil)
        }
        
        // Handle errors
        guard (200...299).contains(httpResponse.statusCode) else {
            let errorMessage = try? JSONDecoder().decode(APIErrorResponse.self, from: data)
            throw APIError.httpError(statusCode: httpResponse.statusCode, message: errorMessage?.error ?? "Unknown error")
        }
        
        // Decode response
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        do {
            return try decoder.decode(responseType, from: data)
        } catch {
            print("Decoding error: \(error)")
            print("Response data: \(String(data: data, encoding: .utf8) ?? "nil")")
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





