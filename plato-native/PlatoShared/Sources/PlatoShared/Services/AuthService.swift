import Foundation

/// Authentication service for handling login, logout, and session management
public class AuthService {
    public static let shared = AuthService()
    
    private let apiClient = APIClient.shared
    
    private init() {}
    
    /// Login with email and password
    public func login(email: String, password: String, rememberMe: Bool = true) async throws -> LoginResponse {
        let request = LoginRequest(email: email, password: password, rememberMe: rememberMe)
        return try await apiClient.post(
            endpoint: APIEndpoint.login.path,
            body: request,
            responseType: LoginResponse.self
        )
    }
    
    /// Register a new user
    public func register(email: String, password: String, name: String, companyName: String) async throws -> RegisterResponse {
        let request = RegisterRequest(
            email: email,
            password: password,
            name: name,
            companyName: companyName
        )
        return try await apiClient.post(
            endpoint: APIEndpoint.register.path,
            body: request,
            responseType: RegisterResponse.self
        )
    }
    
    /// Logout current user
    public func logout() async throws {
        _ = try await apiClient.post(
            endpoint: APIEndpoint.logout.path,
            body: EmptyBody(),
            responseType: EmptyResponse.self
        )
        apiClient.clearCookies()
    }
    
    /// Get current session
    public func getSession() async throws -> SessionResponse {
        return try await apiClient.get(
            endpoint: APIEndpoint.session.path,
            responseType: SessionResponse.self
        )
    }
    
    /// Reset password
    public func resetPassword(email: String) async throws -> EmptyResponse {
        let request = ResetPasswordRequest(email: email)
        return try await apiClient.post(
            endpoint: APIEndpoint.resetPassword.path,
            body: request,
            responseType: EmptyResponse.self
        )
    }
    
    /// Change password
    public func changePassword(currentPassword: String, newPassword: String) async throws -> EmptyResponse {
        let request = ChangePasswordRequest(
            currentPassword: currentPassword,
            newPassword: newPassword
        )
        return try await apiClient.post(
            endpoint: APIEndpoint.changePassword.path,
            body: request,
            responseType: EmptyResponse.self
        )
    }
    
    /// PIN login for device-based access
    public func pinLogin(pin: String) async throws -> PinLoginResponse {
        let request = PinLoginRequest(pin: pin)
        return try await apiClient.post(
            endpoint: "/api/team/pin",
            body: request,
            responseType: PinLoginResponse.self
        )
    }
}

// MARK: - Request/Response Models

struct LoginRequest: Encodable {
    let email: String
    let password: String
    let rememberMe: Bool
}

public struct LoginResponse: Decodable {
    public let success: Bool
    public let requiresMfa: Bool?
    public let mfaType: String?
    public let message: String?
}

struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
    let companyName: String
}

public struct RegisterResponse: Decodable {
    public let success: Bool
    public let message: String?
    public let userId: String?
}

public struct SessionResponse: Decodable {
    public let user: User?
    public let authenticated: Bool
}

struct ResetPasswordRequest: Encodable {
    let email: String
}

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String
}

struct PinLoginRequest: Encodable {
    let pin: String
}

public struct PinLoginResponse: Decodable {
    public let success: Bool
    public let user: User?
    public let message: String?
}

struct EmptyBody: Encodable {}

public struct EmptyResponse: Decodable {}





