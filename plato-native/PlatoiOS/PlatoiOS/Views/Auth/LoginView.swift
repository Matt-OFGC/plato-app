import SwiftUI
import PlatoShared

struct LoginView: View {
    @EnvironmentObject var sessionManager: SessionManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showPinLogin = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // Logo
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)
                    .padding(.bottom, 20)
                
                Text("Plato")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Sign in to your account")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 32)
                
                // Email field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("Enter your email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }
                
                // Password field
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    SecureField("Enter your password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                }
                
                // Error message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                }
                
                // Login button
                Button(action: handleLogin) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isLoading ? Color.gray : Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(isLoading || email.isEmpty || password.isEmpty)
                
                // PIN login button
                Button(action: { showPinLogin = true }) {
                    Text("Sign in with PIN")
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
                .padding(.top, 8)
                
                Spacer()
            }
            .padding()
            .navigationBarHidden(true)
            .sheet(isPresented: $showPinLogin) {
                PinLoginView()
            }
        }
    }
    
    private func handleLogin() {
        isLoading = true
        errorMessage = nil
        
        Task {
            // TEMPORARY DEBUG: Uncomment this to run detailed endpoint test
            // await LoginResponseDebugger.testLoginEndpoint(email: email, password: password)
            
            do {
                print("🔐 Starting login for email: \(email)")
                let response = try await AuthService.shared.login(
                    email: email,
                    password: password
                )
                
                print("✅ Login response received:")
                print("   - success: \(response.success)")
                print("   - requiresMfa: \(response.requiresMfa ?? false)")
                print("   - message: \(response.message ?? "none")")
                print("   - has user: \(response.user != nil)")
                print("   - has company: \(response.company != nil)")
                
                if response.requiresMfa == true {
                    // Handle MFA flow
                    await MainActor.run {
                        errorMessage = "MFA verification required. Please use the web app."
                        isLoading = false
                    }
                } else {
                    // Check session to get user info
                    await sessionManager.checkSession()
                }
            } catch {
                await MainActor.run {
                    // Provide more helpful error messages
                    if let apiError = error as? APIError {
                        errorMessage = apiError.localizedDescription
                    } else {
                        errorMessage = "Login failed: \(error.localizedDescription)"
                    }
                    isLoading = false
                    print("❌ Login error: \(error)")
                    print("   Error type: \(type(of: error))")
                    if let apiError = error as? APIError {
                        print("   API Error: \(apiError)")
                    }
                }
            }
        }
    }
}





