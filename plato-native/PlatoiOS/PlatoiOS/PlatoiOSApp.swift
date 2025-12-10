import SwiftUI
import PlatoShared

@main
struct PlatoiOSApp: App {
    @StateObject private var sessionManager = SessionManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
    }
}

