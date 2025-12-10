import SwiftUI
import PlatoShared

struct RecipeEditView: View {
    let recipeId: String?
    @Environment(\.dismiss) var dismiss
    
    @State private var name: String = ""
    @State private var description: String = ""
    @State private var category: String = ""
    @State private var yieldQuantity: String = "1"
    @State private var yieldUnit: String = "each"
    @State private var sellingPrice: String = ""
    @State private var storage: String = ""
    @State private var shelfLife: String = ""
    @State private var imageUrl: String = ""
    
    @State private var ingredients: [RecipeIngredientRequest] = []
    @State private var steps: [RecipeStepRequest] = []
    
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var availableIngredients: [APIIngredientResponse] = []
    
    @State private var showingIngredientPicker = false
    @State private var showingStepEditor = false
    @State private var editingIngredientIndex: Int?
    @State private var editingStepIndex: Int?
    
    var isNewRecipe: Bool {
        recipeId == nil
    }
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Info Section
                Section(header: Text("Basic Information")) {
                    TextField("Recipe Name", text: $name)
                    TextField("Description", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                    TextField("Category", text: $category)
                    
                    HStack {
                        TextField("Yield Quantity", text: $yieldQuantity)
                            .keyboardType(.decimalPad)
                        Picker("Unit", selection: $yieldUnit) {
                            Text("each").tag("each")
                            Text("servings").tag("servings")
                            Text("slices").tag("slices")
                            Text("portions").tag("portions")
                        }
                    }
                    
                    TextField("Selling Price (£)", text: $sellingPrice)
                        .keyboardType(.decimalPad)
                    
                    TextField("Storage", text: $storage)
                    TextField("Shelf Life", text: $shelfLife)
                    TextField("Image URL", text: $imageUrl)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }
                
                // Ingredients Section
                Section(header: HStack {
                    Text("Ingredients")
                    Spacer()
                    Button(action: { addIngredient() }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.green)
                    }
                }) {
                    if ingredients.isEmpty {
                        Text("No ingredients added")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(Array(ingredients.enumerated()), id: \.offset) { index, ingredient in
                            IngredientRowView(
                                ingredient: Binding(
                                    get: { ingredients[index] },
                                    set: { ingredients[index] = $0 }
                                ),
                                availableIngredients: availableIngredients,
                                onDelete: { ingredients.remove(at: index) }
                            )
                        }
                    }
                }
                
                // Steps Section
                Section(header: HStack {
                    Text("Steps")
                    Spacer()
                    Button(action: { addStep() }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.green)
                    }
                }) {
                    if steps.isEmpty {
                        Text("No steps added")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                            StepRowView(
                                step: Binding(
                                    get: { steps[index] },
                                    set: { steps[index] = $0 }
                                ),
                                onDelete: { steps.remove(at: index) }
                            )
                        }
                    }
                }
                
                // Error Message
                if let errorMessage = errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle(isNewRecipe ? "New Recipe" : "Edit Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Save") {
                        saveRecipe()
                    }
                    .disabled(isSaving || name.isEmpty)
                }
            }
            .task {
                if !isNewRecipe, let id = recipeId {
                    loadRecipe(id: id)
                }
                loadAvailableIngredients()
            }
        }
    }
    
    private func loadRecipe(id: String) {
        isLoading = true
        
        Task {
            do {
                let apiRecipe = try await RecipeService.shared.getRecipe(id: id)
                
                await MainActor.run {
                    self.name = apiRecipe.name
                    self.description = apiRecipe.description ?? ""
                    self.category = apiRecipe.category ?? ""
                    // TODO: Get yieldQuantity from API when available
                    self.yieldQuantity = "1"
                    self.yieldUnit = "each" // TODO: Get from API
                    self.sellingPrice = apiRecipe.selling_price?.description ?? ""
                    self.storage = apiRecipe.shelf_life ?? "" // TODO: Fix mapping
                    self.shelfLife = apiRecipe.shelf_life ?? ""
                    self.imageUrl = apiRecipe.image_url ?? ""
                    
                    // Convert items to ingredient requests
                    var allIngredients: [RecipeIngredientRequest] = []
                    if let items = apiRecipe.items {
                        allIngredients.append(contentsOf: items.map { item in
                            RecipeIngredientRequest(
                                id: String(item.id),
                                name: item.ingredient?.name ?? "Unknown",
                                quantity: String(item.quantity),
                                unit: item.unit
                            )
                        })
                    }
                    
                    // Convert sections to steps
                    var allSteps: [RecipeStepRequest] = []
                    if let sections = apiRecipe.sections {
                        for section in sections {
                            let stepIngredients = (section.items ?? []).map { item in
                                RecipeIngredientRequest(
                                    id: String(item.id),
                                    name: item.ingredient?.name ?? "Unknown",
                                    quantity: String(item.quantity),
                                    unit: item.unit,
                                    stepId: String(section.id)
                                )
                            }
                            allIngredients.append(contentsOf: stepIngredients)
                            
                            let methodLines = section.method?.components(separatedBy: "\n") ?? []
                            allSteps.append(RecipeStepRequest(
                                id: String(section.id),
                                title: section.title,
                                method: section.method,
                                instructions: methodLines.isEmpty ? nil : methodLines,
                                temperatureC: section.bakeTemp,
                                durationMin: section.bakeTime
                            ))
                        }
                    }
                    
                    self.ingredients = allIngredients
                    self.steps = allSteps
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
    
    private func loadAvailableIngredients() {
        Task {
            do {
                let ingredients = try await IngredientService.shared.getIngredients()
                await MainActor.run {
                    self.availableIngredients = ingredients
                }
            } catch {
                print("Failed to load ingredients: \(error)")
            }
        }
    }
    
    private func addIngredient() {
        let newIngredient = RecipeIngredientRequest(
            id: UUID().uuidString,
            name: "",
            quantity: "1",
            unit: "each"
        )
        ingredients.append(newIngredient)
    }
    
    private func addStep() {
        let newStep = RecipeStepRequest(
            id: UUID().uuidString,
            title: "Step \(steps.count + 1)",
            method: nil,
            instructions: nil
        )
        steps.append(newStep)
    }
    
    private func saveRecipe() {
        isSaving = true
        errorMessage = nil
        
        Task {
            do {
                if isNewRecipe {
                    let request = CreateRecipeRequest(
                        name: name,
                        description: description.isEmpty ? nil : description,
                        category: category.isEmpty ? nil : category,
                        yieldQuantity: yieldQuantity,
                        yieldUnit: yieldUnit,
                        sellingPrice: sellingPrice.isEmpty ? nil : sellingPrice,
                        storage: storage.isEmpty ? nil : storage,
                        shelfLife: shelfLife.isEmpty ? nil : shelfLife,
                        imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                        ingredients: ingredients.isEmpty ? nil : ingredients,
                        steps: steps.isEmpty ? nil : steps
                    )
                    
                    _ = try await RecipeService.shared.createRecipe(request)
                    
                    await MainActor.run {
                        isSaving = false
                        dismiss()
                    }
                } else if let id = recipeId {
                    let request = UpdateRecipeRequest(
                        name: name,
                        description: description.isEmpty ? nil : description,
                        category: category.isEmpty ? nil : category,
                        yieldQuantity: yieldQuantity,
                        yieldUnit: yieldUnit,
                        sellingPrice: sellingPrice.isEmpty ? nil : sellingPrice,
                        storage: storage.isEmpty ? nil : storage,
                        shelfLife: shelfLife.isEmpty ? nil : shelfLife,
                        imageUrl: imageUrl.isEmpty ? nil : imageUrl,
                        ingredients: ingredients.isEmpty ? nil : ingredients,
                        steps: steps.isEmpty ? nil : steps
                    )
                    
                    _ = try await RecipeService.shared.updateRecipe(id: id, request)
                    
                    await MainActor.run {
                        isSaving = false
                        dismiss()
                    }
                }
            } catch {
                await MainActor.run {
                    errorMessage = error.localizedDescription
                    isSaving = false
                }
            }
        }
    }
}

struct IngredientRowView: View {
    @Binding var ingredient: RecipeIngredientRequest
    let availableIngredients: [APIIngredientResponse]
    let onDelete: () -> Void
    
    @State private var showingIngredientPicker = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TextField("Ingredient Name", text: $ingredient.name)
                    .autocapitalization(.words)
                
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
            
            HStack {
                TextField("Quantity", text: $ingredient.quantity)
                    .keyboardType(.decimalPad)
                    .frame(width: 80)
                
                Picker("Unit", selection: $ingredient.unit) {
                    Text("g").tag("g")
                    Text("kg").tag("kg")
                    Text("ml").tag("ml")
                    Text("l").tag("l")
                    Text("tsp").tag("tsp")
                    Text("tbsp").tag("tbsp")
                    Text("each").tag("each")
                    Text("slices").tag("slices")
                }
                .pickerStyle(.menu)
            }
        }
    }
}

struct StepRowView: View {
    @Binding var step: RecipeStepRequest
    let onDelete: () -> Void
    
    @State private var instructionText: String = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TextField("Step Title", text: $step.title)
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
            }
            
            TextField("Instructions", text: Binding(
                get: { 
                    if let instructions = step.instructions, !instructions.isEmpty {
                        return instructions.joined(separator: "\n")
                    }
                    return step.method ?? ""
                },
                set: { newValue in
                    let lines = newValue.components(separatedBy: "\n").filter { !$0.isEmpty }
                    if lines.isEmpty {
                        step.method = newValue.isEmpty ? nil : newValue
                        step.instructions = nil
                    } else {
                        step.instructions = lines
                        step.method = nil
                    }
                }
            ), axis: .vertical)
            .lineLimit(3...6)
            
            HStack {
                TextField("Temperature (°C)", value: $step.temperatureC, format: .number)
                    .keyboardType(.numberPad)
                    .frame(width: 100)
                
                TextField("Duration (min)", value: $step.durationMin, format: .number)
                    .keyboardType(.numberPad)
                    .frame(width: 100)
            }
        }
    }
}

