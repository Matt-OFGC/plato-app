import SwiftUI
import PlatoShared

struct ContentView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        Group {
            if sessionManager.isAuthenticated {
                MainWindowView()
            } else {
                LoginView()
            }
        }
        .frame(minWidth: 800, minHeight: 600)
        .task {
            await sessionManager.checkSession()
        }
    }
}

struct MainWindowView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        NavigationSplitView {
            SidebarView()
        } detail: {
            DashboardView()
        }
    }
}

struct SidebarView: View {
    @State private var selection: NavigationItem? = .dashboard
    
    enum NavigationItem: String, CaseIterable {
        case dashboard = "Dashboard"
        case recipes = "Recipes"
        case ingredients = "Ingredients"
        case staff = "Staff"
        case wholesale = "Wholesale"
        case profile = "Profile"
        
        var icon: String {
            switch self {
            case .dashboard: return "house.fill"
            case .recipes: return "book.fill"
            case .ingredients: return "leaf.fill"
            case .staff: return "person.2.fill"
            case .wholesale: return "cart.fill"
            case .profile: return "person.fill"
            }
        }
    }
    
    var body: some View {
        List(selection: $selection) {
            ForEach(NavigationItem.allCases, id: \.self) { item in
                NavigationLink(value: item) {
                    Label(item.rawValue, systemImage: item.icon)
                }
            }
        }
        .navigationTitle("Plato")
    }
}




