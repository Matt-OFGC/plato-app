import SwiftUI
import PlatoShared

struct DashboardView: View {
    @EnvironmentObject var sessionManager: SessionManager
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            RecipeListView()
                .tabItem {
                    Label("Recipes", systemImage: "book.fill")
                }
                .tag(1)
            
            IngredientsView()
                .tabItem {
                    Label("Ingredients", systemImage: "leaf.fill")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(3)
        }
    }
}

struct HomeView: View {
    @EnvironmentObject var sessionManager: SessionManager
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Welcome section
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
                    
                    // Quick stats or actions can go here
                    Text("Dashboard content coming soon")
                        .foregroundColor(.secondary)
                        .padding()
                }
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
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
                    Button(action: {
                        Task {
                            try? await sessionManager.logout()
                        }
                    }) {
                        Text("Sign Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}





