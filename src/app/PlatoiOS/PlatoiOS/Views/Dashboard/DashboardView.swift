import SwiftUI
import PlatoShared

struct DashboardView: View {
    @EnvironmentObject var sessionManager: SessionManager
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            
            recipesEntryView
                .tabItem { Label("Recipes", systemImage: "book.fill") }
                .tag(1)
            
            ingredientsEntryView
                .tabItem { Label("Ingredients", systemImage: "leaf.fill") }
                .tag(2)
            
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.fill") }
                .tag(3)
        }
    }
    
    // MARK: - Adaptive entries
    @ViewBuilder
    private var recipesEntryView: some View {
        if isRegularPad {
            RecipeSplitView()
        } else {
            // Fallback to phone recipe list (not present in this subset)
            Text("Recipe list unavailable in this build")
        }
    }
    
    @ViewBuilder
    private var ingredientsEntryView: some View {
        if isRegularPad {
            IngredientSplitView()
        } else {
            Text("Ingredients unavailable in this build")
        }
    }
    
    private var isRegularPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad && horizontalSizeClass == .regular
    }
}

struct HomeView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        if let user = sessionManager.currentUser {
                            Text(user.name ?? user.email)
                                .font(.title3)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    
                    Text("Dashboard content coming soon")
                        .foregroundColor(.secondary)
                        .padding()
                }
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Logout") {
                        Task { try? await sessionManager.logout() }
                    }
                }
            }
        }
    }
}

struct ProfileView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        NavigationView {
            List {
                if let user = sessionManager.currentUser {
                    Section("Account") {
                        Label(user.email, systemImage: "envelope")
                        if let name = user.name {
                            Label(name, systemImage: "person")
                        }
                    }
                }
                
                Section {
                    Button(role: .destructive) {
                        Task { try? await sessionManager.logout() }
                    } label: {
                        Text("Sign Out")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

// Fallback stubs in case iPad split views are not in this target.
// Remove these if the real iPad views are added to the build.
struct RecipeSplitView: View {
    var body: some View {
        RecipeListView()
    }
}

struct IngredientSplitView: View {
    var body: some View {
        IngredientsView()
    }
}

// Fallback stubs in case iPad split views are not included in the target.
// If the real iPad views are in the target, remove these.
struct RecipeSplitView: View {
    var body: some View {
        RecipeListView()
    }
}

struct IngredientSplitView: View {
    var body: some View {
        IngredientsView()
    }
}

