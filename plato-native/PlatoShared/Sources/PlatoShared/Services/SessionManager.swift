import Foundation

/// Manages user session state and persistence
public class SessionManager: ObservableObject {
    public static let shared = SessionManager()
    
    @Published public private(set) var currentUser: User?
    @Published public private(set) var isAuthenticated: Bool = false
    
    private let userDefaults = UserDefaults.standard
    private let authService = AuthService.shared
    
    private init() {
        // Check for existing session on init
        Task {
            await checkSession()
        }
    }
    
    /// Check if there's an active session
    @MainActor
    public func checkSession() async {
        do {
            let response = try await authService.getSession()
            if response.authenticated, let user = response.user {
                self.currentUser = user
                self.isAuthenticated = true
            } else {
                self.currentUser = nil
                self.isAuthenticated = false
            }
        } catch {
            self.currentUser = nil
            self.isAuthenticated = false
        }
    }
    
    /// Set the current user (called after successful login)
    @MainActor
    public func setUser(_ user: User) {
        self.currentUser = user
        self.isAuthenticated = true
    }
    
    /// Clear session (called after logout)
    @MainActor
    public func clearSession() {
        self.currentUser = nil
        self.isAuthenticated = false
    }
    
    /// Logout and clear session
    @MainActor
    public func logout() async throws {
        try await authService.logout()
        clearSession()
    }
}




