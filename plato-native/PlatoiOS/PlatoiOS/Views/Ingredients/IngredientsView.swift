import SwiftUI
import PlatoShared

struct IngredientsView: View {
    @State private var ingredients: [APIIngredientResponse] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var searchText: String = ""
    
    var filteredIngredients: [APIIngredientResponse] {
        if searchText.isEmpty {
            return ingredients
        }
        return ingredients.filter { 
            $0.name.localizedCaseInsensitiveContains(searchText) ||
            ($0.supplier?.localizedCaseInsensitiveContains(searchText) ?? false) ||
            ($0.supplierRef?.name.localizedCaseInsensitiveContains(searchText) ?? false) ||
            ($0.notes?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading ingredients...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text("Error")
                            .font(.headline)
                        Text(errorMessage)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                        
                        Button("Retry") {
                            loadIngredients()
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredIngredients.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: searchText.isEmpty ? "leaf" : "magnifyingglass")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text(searchText.isEmpty ? "No ingredients yet" : "No ingredients found")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text(searchText.isEmpty ? "Create your first ingredient to get started" : "Try a different search term")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(filteredIngredients) { ingredient in
                            NavigationLink(destination: IngredientEditView(ingredientId: String(ingredient.id))) {
                                IngredientListRowView(ingredient: ingredient)
                            }
                        }
                        .onDelete(perform: deleteIngredients)
                    }
                    .searchable(text: $searchText, prompt: "Search ingredients")
                }
            }
            .navigationTitle("Ingredients")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(destination: IngredientEditView(ingredientId: nil)) {
                        Image(systemName: "plus")
                    }
                }
            }
            .refreshable {
                loadIngredients()
            }
            .task {
                loadIngredients()
            }
        }
    }
    
    private func loadIngredients() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                print("📤 Loading ingredients...")
                let fetchedIngredients = try await IngredientService.shared.getIngredients()
                print("✅ Loaded \(fetchedIngredients.count) ingredients")
                
                await MainActor.run {
                    self.ingredients = fetchedIngredients
                    self.isLoading = false
                }
            } catch {
                print("❌ Error loading ingredients: \(error)")
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }
    
    private func deleteIngredients(at offsets: IndexSet) {
        Task {
            let idsToDelete = offsets.map { filteredIngredients[$0].id }
            for id in idsToDelete {
                do {
                    try await IngredientService.shared.deleteIngredient(id: String(id))
                } catch {
                    print("Failed to delete ingredient \(id): \(error)")
                    await MainActor.run {
                        errorMessage = error.localizedDescription
                    }
                }
            }
            await MainActor.run {
                loadIngredients()
            }
        }
    }
}

struct IngredientListRowView: View {
    let ingredient: APIIngredientResponse
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ingredient.name)
                .font(.headline)
            
            HStack {
                Text("\(ingredient.packQuantity) \(ingredient.originalUnit)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("£\(ingredient.packPrice)")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(.green)
            }
            
            if let supplier = ingredient.supplierRef?.name ?? ingredient.supplier {
                Text("Supplier: \(supplier)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !ingredient.allergens.isEmpty {
                HStack {
                    ForEach(ingredient.allergens.prefix(3), id: \.self) { allergen in
                        Text(allergen)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.orange.opacity(0.2))
                            .foregroundColor(.orange)
                            .cornerRadius(4)
                    }
                    if ingredient.allergens.count > 3 {
                        Text("+\(ingredient.allergens.count - 3)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}




