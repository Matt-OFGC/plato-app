import SwiftUI

@main
struct PlatoMacApp: App {
    @StateObject private var sessionManager = SessionManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("New Recipe") {
                    // TODO: Open new recipe sheet
                }
                .keyboardShortcut("n", modifiers: .command)
            }
        }
    }
}








