import SwiftUI
import PlatoShared

// This file is kept for reference but PlatoiOSApp.swift is the main entry point
struct PlatoApp: App {
    @StateObject private var sessionManager = SessionManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
    }
}





