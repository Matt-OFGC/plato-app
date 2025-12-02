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
                    List(recipes) { recipe in
                        NavigationLink(destination: RecipeDetailView(recipeId: recipe.id)) {
                            RecipeRowView(recipe: recipe)
                        }
                    }
                }
            }
            .navigationTitle("Recipes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "plus")
                    }
                }
            }
            .task {
                loadRecipes()
            }
        }
    }
    
    private func loadRecipes() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let fetchedRecipes = try await APIClient.shared.get(
                    endpoint: APIEndpoint.recipes.path,
                    responseType: [Recipe].self
                )
                
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

struct RecipeDetailView: View {
    let recipeId: String
    @State private var recipeDetail: RecipeDetail?
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading...")
            } else if let errorMessage = errorMessage {
                Text("Error: \(errorMessage)")
                    .foregroundColor(.red)
            } else if let recipeDetail = recipeDetail {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Recipe header
                        Text(recipeDetail.recipe.name)
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        if let description = recipeDetail.recipe.description {
                            Text(description)
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                        
                        // Ingredients
                        if !recipeDetail.ingredients.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Ingredients")
                                    .font(.headline)
                                
                                ForEach(recipeDetail.ingredients) { ingredient in
                                    HStack {
                                        Text(ingredient.ingredientName)
                                        Spacer()
                                        Text("\(ingredient.quantity) \(ingredient.unit)")
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                        
                        // Steps
                        if !recipeDetail.steps.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Instructions")
                                    .font(.headline)
                                
                                ForEach(recipeDetail.steps) { step in
                                    HStack(alignment: .top, spacing: 12) {
                                        Text("\(step.stepNumber)")
                                            .font(.headline)
                                            .foregroundColor(.white)
                                            .frame(width: 24, height: 24)
                                            .background(Color.green)
                                            .clipShape(Circle())
                                        
                                        Text(step.instruction)
                                            .font(.body)
                                    }
                                }
                            }
                        }
                        
                        // Cost information
                        if let cost = recipeDetail.cost {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Cost")
                                    .font(.headline)
                                
                                Text("Total: £\(cost.totalCost, specifier: "%.2f")")
                                
                                if let costPerServing = cost.costPerServing {
                                    Text("Per serving: £\(costPerServing, specifier: "%.2f")")
                                }
                            }
                            .padding()
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Recipe")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            loadRecipeDetail()
        }
    }
    
    private func loadRecipeDetail() {
        isLoading = true
        
        Task {
            do {
                let detail = try await APIClient.shared.get(
                    endpoint: APIEndpoint.recipe(id: recipeId).path,
                    responseType: RecipeDetail.self
                )
                
                await MainActor.run {
                    self.recipeDetail = detail
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

struct IngredientsView: View {
    var body: some View {
        NavigationView {
            Text("Ingredients view coming soon")
                .navigationTitle("Ingredients")
        }
    }
}




