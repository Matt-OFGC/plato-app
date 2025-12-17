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
    @State private var costTotal: Decimal = 0
    @State private var costPerServing: Decimal?
    @State private var foodCostPercentage: Decimal?
    
    // Placeholder options (wire to backend when available)
    private let storageOptions = ["Ambient", "Chilled", "Frozen", "Counter"]
    private let shelfLifeOptions = ["Same day", "1 day", "3 days", "5 days", "7 days", "14 days"]
    
    var isNewRecipe: Bool { recipeId == nil }
    
    var body: some View {
        NavigationView {
            Form {
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
                    
                    Picker("Storage", selection: $storage) {
                        Text("Select storage").tag("")
                        ForEach(storageOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    Picker("Shelf Life", selection: $shelfLife) {
                        Text("Select shelf life").tag("")
                        ForEach(shelfLifeOptions, id: \.self) { option in
                            Text(option).tag(option)
                        }
                    }
                    
                    TextField("Image URL", text: $imageUrl)
                        .keyboardType(.URL)
                        .autocapitalization(.none)
                }
                
                Section(header: HStack {
                    Text("Ingredients")
                    Spacer()
                    Button(action: addIngredient) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.green)
                    }
                }) {
                    if ingredients.isEmpty {
                        Text("No ingredients added")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(Array(ingredients.enumerated()), id: \.offset) { index, _ in
                            IngredientRowView(
                                ingredient: Binding(
                                    get: { ingredients[index] },
                                    set: { ingredients[index] = $0 }
                                ),
                                availableIngredients: availableIngredients,
                                onDelete: { ingredients.remove(at: index) },
                                onMoveUp: { moveIngredient(from: index, by: -1) },
                                onMoveDown: { moveIngredient(from: index, by: 1) }
                            )
                        }
                    }
                }
                
                Section(header: HStack {
                    Text("Steps")
                    Spacer()
                    Button(action: addStep) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.green)
                    }
                }) {
                    if steps.isEmpty {
                        Text("No steps added")
                            .foregroundColor(.secondary)
                    } else {
                        ForEach(Array(steps.enumerated()), id: \.offset) { index, _ in
                            StepRowView(
                                step: Binding(
                                    get: { steps[index] },
                                    set: { steps[index] = $0 }
                                ),
                                onDelete: { steps.remove(at: index) },
                                onMoveUp: { moveStep(from: index, by: -1) },
                                onMoveDown: { moveStep(from: index, by: 1) }
                            )
                        }
                    }
                }
                
                Section(header: Text("Cost Insights")) {
                    HStack {
                        Text("Total cost")
                        Spacer()
                        Text("£\(formatDecimal(costTotal))")
                            .foregroundColor(.green)
                    }
                    if let costPerServing = costPerServing {
                        HStack {
                            Text("Per serving")
                            Spacer()
                            Text("£\(formatDecimal(costPerServing))")
                                .foregroundColor(.green)
                        }
                    }
                    if let foodCostPercentage = foodCostPercentage {
                        HStack {
                            Text("Food cost %")
                            Spacer()
                            Text("\(formatDecimal(foodCostPercentage))%")
                                .foregroundColor(foodCostPercentage > 30 ? .orange : .green)
                        }
                    }
                }
                
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
                    Button("Cancel") { dismiss() }
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
                await recalcCosts()
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
                    self.yieldQuantity = apiRecipe.yieldQuantity ?? "1"
                    self.yieldUnit = apiRecipe.yieldUnit ?? "each"
                    self.sellingPrice = apiRecipe.selling_price?.description ?? ""
                    self.storage = apiRecipe.storage ?? ""
                    self.shelfLife = apiRecipe.shelf_life ?? ""
                    self.imageUrl = apiRecipe.image_url ?? ""
                    
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
                await recalcCosts()
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
                await recalcCosts()
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
        Task { await recalcCosts() }
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
    
    private func moveIngredient(from index: Int, by offset: Int) {
        let newIndex = index + offset
        guard ingredients.indices.contains(index), ingredients.indices.contains(newIndex) else { return }
        ingredients.swapAt(index, newIndex)
    }
    
    private func moveStep(from index: Int, by offset: Int) {
        let newIndex = index + offset
        guard steps.indices.contains(index), steps.indices.contains(newIndex) else { return }
        steps.swapAt(index, newIndex)
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
    
    // MARK: - Cost calculation
    private func recalcCosts() async {
        guard !ingredients.isEmpty else {
            await MainActor.run {
                costTotal = 0
                costPerServing = nil
                foodCostPercentage = nil
            }
            return
        }
        
        let mapped: [RecipeIngredient] = ingredients.compactMap { ing in
            guard let qty = Decimal(string: ing.quantity) else { return nil }
            return RecipeIngredient(
                id: ing.id,
                ingredientId: ing.name,
                ingredientName: ing.name,
                quantity: qty,
                unit: ing.unit,
                cost: nil,
                sectionId: ing.stepId
            )
        }
        
        let total = CostCalculator.calculateRecipeCost(
            ingredients: mapped,
            availableIngredients: availableIngredients
        )
        let servingsDecimal = Decimal(string: yieldQuantity) ?? 1
        let perServing = CostCalculator.calculateCostPerServing(totalCost: total, servings: servingsDecimal)
        let sellPriceDecimal = Decimal(string: sellingPrice)
        let foodPct: Decimal?
        if let perServing, let sellPriceDecimal {
            foodPct = CostCalculator.calculateFoodCostPercentage(costPerServing: perServing, sellingPrice: sellPriceDecimal)
        } else {
            foodPct = nil
        }
        await MainActor.run {
            self.costTotal = total
            self.costPerServing = perServing
            self.foodCostPercentage = foodPct
        }
    }
    
    private func formatDecimal(_ value: Decimal) -> String {
        let ns = NSDecimalNumber(decimal: value)
        return String(format: "%.2f", ns.doubleValue)
    }
}

struct IngredientRowView: View {
    @Binding var ingredient: RecipeIngredientRequest
    let availableIngredients: [APIIngredientResponse]
    let onDelete: () -> Void
    let onMoveUp: () -> Void
    let onMoveDown: () -> Void
    
    @State private var showingIngredientPicker = false
    @State private var ingredientSearch: String = ""
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TextField("Ingredient Name", text: $ingredient.name)
                    .autocapitalization(.words)
                
                Button(action: { showingIngredientPicker = true }) {
                    Image(systemName: "magnifyingglass")
                }
                
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
                
                VStack(spacing: 4) {
                    Button(action: onMoveUp) { Image(systemName: "chevron.up") }.buttonStyle(.plain)
                    Button(action: onMoveDown) { Image(systemName: "chevron.down") }.buttonStyle(.plain)
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
        .sheet(isPresented: $showingIngredientPicker) {
            NavigationView {
                List {
                    ForEach(filteredIngredients, id: \.id) { ing in
                        Button {
                            ingredient.name = ing.name
                            ingredient.unit = ing.packUnit
                            showingIngredientPicker = false
                        } label: {
                            VStack(alignment: .leading) {
                                Text(ing.name)
                                Text("\(ing.packQuantity) \(ing.packUnit) • £\(ing.packPrice)")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }
                .searchable(text: $ingredientSearch)
                .navigationTitle("Select Ingredient")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Close") { showingIngredientPicker = false }
                    }
                }
            }
        }
    }
    
    private var filteredIngredients: [APIIngredientResponse] {
        guard !ingredientSearch.isEmpty else { return availableIngredients }
        return availableIngredients.filter { $0.name.localizedCaseInsensitiveContains(ingredientSearch) }
    }
}

struct StepRowView: View {
    @Binding var step: RecipeStepRequest
    let onDelete: () -> Void
    let onMoveUp: () -> Void
    let onMoveDown: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                TextField("Step Title", text: $step.title)
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                }
                VStack(spacing: 4) {
                    Button(action: onMoveUp) { Image(systemName: "chevron.up") }.buttonStyle(.plain)
                    Button(action: onMoveDown) { Image(systemName: "chevron.down") }.buttonStyle(.plain)
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

