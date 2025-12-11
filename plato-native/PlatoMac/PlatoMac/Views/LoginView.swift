import SwiftUI
import PlatoShared

struct LoginView: View {
    @EnvironmentObject var sessionManager: SessionManager
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo and title
            VStack(spacing: 16) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.green)
                
                Text("Plato")
                    .font(.system(size: 48, weight: .bold))
                
                Text("Restaurant Management")
                    .font(.title3)
                    .foregroundColor(.secondary)
            }
            
            // Login form
            VStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.headline)
                    TextField("Enter your email", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 400)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Password")
                        .font(.headline)
                    SecureField("Enter your password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 400)
                        .textContentType(.password)
                }
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .frame(width: 400, alignment: .leading)
                }
                
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
                    .frame(width: 400)
                    .padding()
                    .background(isLoading ? Color.gray : Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .disabled(isLoading || email.isEmpty || password.isEmpty)
                .buttonStyle(.plain)
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
    
    private func handleLogin() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await AuthService.shared.login(
                    email: email,
                    password: password
                )
                
                if response.requiresMfa == true {
                    await MainActor.run {
                        errorMessage = "MFA verification required. Please use the web app."
                        isLoading = false
                    }
                } else {
                    await sessionManager.checkSession()
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}








