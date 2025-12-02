import SwiftUI
import PlatoShared

struct PinLoginView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var sessionManager: SessionManager
    @State private var pin = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Device PIN Login")
                    .font(.title2)
                    .fontWeight(.bold)
                    .padding(.top)
                
                Text("Enter your PIN to access this device")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                // PIN field
                SecureField("Enter PIN", text: $pin)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numberPad)
                    .padding(.horizontal)
                    .onChange(of: pin) { newValue in
                        // Limit to 4-6 digits
                        pin = String(newValue.prefix(6))
                    }
                
                // Error message
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal)
                }
                
                // Login button
                Button(action: handlePinLogin) {
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
                .disabled(isLoading || pin.isEmpty)
                .padding(.horizontal)
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private func handlePinLogin() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await AuthService.shared.pinLogin(pin: pin)
                
                if response.success, let user = response.user {
                    await MainActor.run {
                        sessionManager.setUser(user)
                        dismiss()
                    }
                } else {
                    await MainActor.run {
                        errorMessage = response.message ?? "Invalid PIN"
                        isLoading = false
                    }
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




