import SwiftUI
import PlatoShared

struct RecipeListView: View {
    @State private var recipes: [Recipe] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading recipes...")
                } else if let errorMessage = errorMessage {
                    VStack {
                        Text("Error")
                            .font(.headline)
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                        
                        Button("Retry") {
                            loadRecipes()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                } else if recipes.isEmpty {
                    VStack {
                        Text("No recipes yet")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("Create your first recipe to get started")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
                } else {
                    List {
                        ForEach(recipes) { recipe in
                            NavigationLink(destination: RecipeDetailView(recipeId: recipe.id)) {
                                RecipeRowView(recipe: recipe)
                            }
                        }
                        .onDelete(perform: deleteRecipes)
                    }
                }
            }
            .navigationTitle("Recipes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: RecipeEditView(recipeId: nil)) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                loadRecipes()
            }
        }
    }
    
    private func deleteRecipes(at offsets: IndexSet) {
        Task {
            let idsToDelete = offsets.map { recipes[$0].id }
            for id in idsToDelete {
                do {
                    try await RecipeService.shared.deleteRecipe(id: id)
                } catch {
                    print("Failed to delete recipe \(id): \(error)")
                }
            }
            await MainActor.run {
                loadRecipes()
            }
        }
    }
    
    private func loadRecipes() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                // Fetch API response format using RecipeService
                let apiRecipes = try await RecipeService.shared.getRecipes(full: false)
                
                // Get companyId from session (we'll need to store this)
                // For now, use a placeholder - we'll fix this properly later
                let companyId = "1" // TODO: Get from SessionManager
                let createdById = "1" // TODO: Get from SessionManager
                
                // Convert API response to Recipe model
                let fetchedRecipes = apiRecipes.map { apiRecipe in
                    Recipe(from: apiRecipe, companyId: companyId, createdById: createdById)
                }
                
                await MainActor.run {
                    self.recipes = fetchedRecipes
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
}

struct RecipeRowView: View {
    let recipe: Recipe
    
    var body: some View {
        HStack {
            // Recipe image placeholder
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.2))
                .frame(width: 60, height: 60)
                .overlay {
                    Image(systemName: "photo")
                        .foregroundColor(.gray)
                }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.name)
                    .font(.headline)
                
                if let description = recipe.description {
                    Text(description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                if let servings = recipe.servings {
                    Text("\(servings) servings")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            if recipe.isProtected {
                Image(systemName: "lock.fill")
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 4)
    }
}

// RecipeDetailView has been moved to RecipeDetailView.swift - using the new polished version with view modes






