import SwiftUI
import PlatoShared

struct ContentView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        Group {
            if sessionManager.isAuthenticated {
                DashboardView()
            } else {
                LoginView()
            }
        }
        .task {
            await sessionManager.checkSession()
        }
    }
}






