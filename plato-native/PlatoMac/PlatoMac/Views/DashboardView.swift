import SwiftUI
import PlatoShared

struct DashboardView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Welcome section
                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome back")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    if let user = sessionManager.currentUser {
                        Text(user.name ?? user.email)
                            .font(.title2)
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                
                // Dashboard content
                Text("Dashboard content coming soon")
                    .foregroundColor(.secondary)
                    .padding()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button(action: {
                    Task {
                        try? await sessionManager.logout()
                    }
                }) {
                    Text("Logout")
                }
            }
        }
    }
}




