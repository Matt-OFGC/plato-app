import SwiftUI
import PlatoShared

struct RecipeDetailView: View {
    let recipeId: String
    @State private var recipeDetail: RecipeDetail?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var availableIngredients: [APIIngredientResponse] = []
    @State private var viewMode: RecipeViewMode = .whole
    
    enum RecipeViewMode: String, CaseIterable {
        case whole = "Whole Recipe"
        case steps = "Steps"
        case edit = "Edit"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                if isLoading {
                    ProgressView("Loading recipe...")
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                } else if let errorMessage = errorMessage {
                    ErrorView(message: errorMessage, onRetry: { loadRecipeDetail() })
                } else if let recipeDetail = recipeDetail {
                    // Header Card with Image and Title
                    RecipeHeaderCard(
                        recipe: recipeDetail.recipe,
                        imageUrl: recipeDetail.recipe.imageUrl,
                        category: recipeDetail.recipe.categoryId ?? "Uncategorized",
                        servings: recipeDetail.recipe.servings ?? 1
                    )
                    
                    // View Mode Selector
                    ViewModeSelector(selectedMode: $viewMode)
                    
                    // Content based on view mode
                    switch viewMode {
                    case .whole:
                        WholeRecipeView(recipeDetail: recipeDetail, availableIngredients: availableIngredients)
                    case .steps:
                        StepsView(recipeDetail: recipeDetail)
                    case .edit:
                        EditRecipeView(recipeId: recipeId, recipeDetail: recipeDetail)
                    }
                } else {
                    EmptyStateView(message: "No recipe data available")
                }
            }
            .padding()
        }
        .navigationTitle("Recipe")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                NavigationLink(destination: RecipeEditView(recipeId: recipeId)) {
                    Text("Edit")
                }
            }
        }
        .task {
            loadRecipeDetail()
        }
        .refreshable {
            loadRecipeDetail()
        }
    }
    
    private func loadRecipeDetail() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let apiRecipes = try await RecipeService.shared.getRecipes(full: true)
                guard let apiRecipe = apiRecipes.first(where: { String($0.id) == recipeId }) else {
                    throw NSError(domain: "RecipeDetail", code: 404, userInfo: [NSLocalizedDescriptionKey: "Recipe not found"])
                }
                
                let companyId = "1" // TODO: Get from SessionManager
                let createdById = "1" // TODO: Get from SessionManager
                let recipe = Recipe(from: apiRecipe, companyId: companyId, createdById: createdById)
                
                // Convert items to RecipeIngredient format
                var ingredients: [RecipeIngredient] = []
                
                if let items = apiRecipe.items {
                    ingredients.append(contentsOf: items.map { item in
                        RecipeIngredient(
                            id: String(item.id),
                            ingredientId: String(item.ingredient?.id ?? 0),
                            ingredientName: item.ingredient?.name ?? "Unknown",
                            quantity: Decimal(item.quantity),
                            unit: item.unit,
                            cost: nil,
                            sectionId: nil
                        )
                    })
                }
                
                if let sections = apiRecipe.sections {
                    for section in sections {
                        if let sectionItems = section.items {
                            ingredients.append(contentsOf: sectionItems.map { item in
                                RecipeIngredient(
                                    id: String(item.id),
                                    ingredientId: String(item.ingredient?.id ?? 0),
                                    ingredientName: item.ingredient?.name ?? "Unknown",
                                    quantity: Decimal(item.quantity),
                                    unit: item.unit,
                                    cost: nil,
                                    sectionId: String(section.id)
                                )
                            })
                        }
                    }
                }
                
                // Convert sections to steps
                var steps: [RecipeStep] = []
                if let sections = apiRecipe.sections {
                    for (index, section) in sections.enumerated() {
                        let instruction = section.method ?? section.title
                        steps.append(RecipeStep(
                            id: String(section.id),
                            sectionId: String(section.id),
                            stepNumber: index + 1,
                            instruction: instruction,
                            temperature: section.bakeTemp,
                            duration: section.bakeTime,
                            hasTimer: false
                        ))
                    }
                }
                
                // Load ingredients for cost calculation
                let allIngredients = try await IngredientService.shared.getIngredients()
                
                // Calculate costs
                let totalCost = CostCalculator.calculateRecipeCost(
                    ingredients: ingredients,
                    availableIngredients: allIngredients
                )
                
                let yieldQtyString = apiRecipe.yieldQuantity ?? "1"
                let servings = Decimal(string: yieldQtyString) ?? 1
                let costPerServing = CostCalculator.calculateCostPerServing(
                    totalCost: totalCost,
                    servings: servings
                )
                
                var foodCostPercentage: Decimal? = nil
                if let sellingPrice = apiRecipe.selling_price,
                   let costPerServing = costPerServing {
                    foodCostPercentage = CostCalculator.calculateFoodCostPercentage(
                        costPerServing: costPerServing,
                        sellingPrice: Decimal(sellingPrice)
                    )
                }
                
                let cost = RecipeCost(
                    totalCost: totalCost,
                    costPerServing: costPerServing,
                    costPerSlice: nil,
                    foodCostPercentage: foodCostPercentage
                )
                
                let detail = RecipeDetail(
                    recipe: recipe,
                    ingredients: ingredients,
                    steps: steps,
                    cost: cost
                )
                
                await MainActor.run {
                    self.recipeDetail = detail
                    self.availableIngredients = allIngredients
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

// MARK: - Header Card

struct RecipeHeaderCard: View {
    let recipe: Recipe
    let imageUrl: String?
    let category: String
    let servings: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                // Recipe Image
                Group {
                    if let imageUrl = imageUrl, !imageUrl.isEmpty {
                        AsyncImage(url: URL(string: imageUrl)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            ImagePlaceholder()
                        }
                    } else {
                        ImagePlaceholder()
                    }
                }
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                )
                
                // Title and Info
                VStack(alignment: .leading, spacing: 6) {
                    Text(recipe.name)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    HStack(spacing: 8) {
                        Text(category)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Text("•")
                            .foregroundColor(.secondary)
                        
                        Text("\(servings) servings")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
            }
            
            if let description = recipe.description, !description.isEmpty {
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct ImagePlaceholder: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.orange.opacity(0.4), Color.pink.opacity(0.4)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            Image(systemName: "photo.fill")
                .font(.title)
                .foregroundColor(.white)
        }
    }
}

// MARK: - View Mode Selector

struct ViewModeSelector: View {
    @Binding var selectedMode: RecipeDetailView.RecipeViewMode
    
    var body: some View {
        HStack(spacing: 0) {
            ForEach(RecipeDetailView.RecipeViewMode.allCases, id: \.self) { mode in
                Button(action: {
                    selectedMode = mode
                }) {
                    Text(mode.rawValue)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(selectedMode == mode ? .white : .primary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(selectedMode == mode ? Color.green : Color.clear)
                }
            }
        }
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Whole Recipe View

struct WholeRecipeView: View {
    let recipeDetail: RecipeDetail
    let availableIngredients: [APIIngredientResponse]
    
    var body: some View {
        VStack(spacing: 20) {
            // Ingredients Card
            if !recipeDetail.ingredients.isEmpty {
                IngredientsCard(
                    ingredients: recipeDetail.ingredients,
                    availableIngredients: availableIngredients
                )
            }
            
            // Instructions Card
            if !recipeDetail.steps.isEmpty {
                InstructionsCard(steps: recipeDetail.steps)
            }
            
            // Cost Analysis Card
            if let cost = recipeDetail.cost {
                CostAnalysisCard(cost: cost, sellingPrice: nil)
            }
        }
    }
}

// MARK: - Ingredients Card

struct IngredientsCard: View {
    let ingredients: [RecipeIngredient]
    let availableIngredients: [APIIngredientResponse]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            Text("INGREDIENTS")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
                .textCase(.uppercase)
                .tracking(0.5)
            
            // Ingredients List
            VStack(alignment: .leading, spacing: 12) {
                ForEach(ingredients) { ingredient in
                    IngredientRow(
                        ingredient: ingredient,
                        availableIngredients: availableIngredients
                    )
                    
                    if ingredient.id != ingredients.last?.id {
                        Divider()
                            .padding(.vertical, 4)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct IngredientRow: View {
    let ingredient: RecipeIngredient
    let availableIngredients: [APIIngredientResponse]
    
    @State private var cost: Decimal? = nil
    
    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(ingredient.ingredientName)
                    .font(.body)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                if let cost = cost {
                    Text("£\(String(format: "%.2f", NSDecimalNumber(decimal: cost).doubleValue))")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
            
            Spacer()
            
            Text("\(NSDecimalNumber(decimal: ingredient.quantity).stringValue) \(ingredient.unit)")
                .font(.body)
                .foregroundColor(.secondary)
        }
        .task {
            calculateCost()
        }
    }
    
    private func calculateCost() {
        guard let ingredientId = Int(ingredient.ingredientId),
              let availableIngredient = availableIngredients.first(where: { $0.id == ingredientId }),
              let packQty = Decimal(string: availableIngredient.packQuantity),
              let packPrice = Decimal(string: availableIngredient.packPrice) else {
            return
        }
        
        let density = availableIngredient.densityGPerMl.flatMap { Decimal(string: $0) }
        
        if let ingredientCost = CostCalculator.computeIngredientUsageCost(
            usageQuantity: ingredient.quantity,
            usageUnit: ingredient.unit,
            packQuantity: packQty,
            packUnit: availableIngredient.packUnit,
            packPrice: packPrice,
            densityGPerMl: density
        ) {
            cost = ingredientCost
        }
    }
}

// MARK: - Instructions Card

struct InstructionsCard: View {
    let steps: [RecipeStep]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("INSTRUCTIONS")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
                .textCase(.uppercase)
                .tracking(0.5)
            
            VStack(alignment: .leading, spacing: 16) {
                ForEach(steps) { step in
                    StepRow(step: step)
                }
            }
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct StepRow: View {
    let step: RecipeStep
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Step Number Badge
            Text("\(step.stepNumber)")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color.green)
                .clipShape(Circle())
            
            // Instruction
            VStack(alignment: .leading, spacing: 4) {
                Text(step.instruction)
                    .font(.body)
                    .foregroundColor(.primary)
                    .fixedSize(horizontal: false, vertical: true)
                
                // Temperature and Duration
                if let temperature = step.temperature, let duration = step.duration {
                    HStack(spacing: 12) {
                        Label("\(temperature)°C", systemImage: "thermometer")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Label("\(duration) min", systemImage: "clock")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Cost Analysis Card

struct CostAnalysisCard: View {
    let cost: RecipeCost
    let sellingPrice: Decimal?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("COST ANALYSIS")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.gray)
                .textCase(.uppercase)
                .tracking(0.5)
            
            VStack(alignment: .leading, spacing: 12) {
                // Total Cost
                HStack {
                    Text("Total Cost")
                        .font(.body)
                        .foregroundColor(.primary)
                    Spacer()
                    Text("£\(String(format: "%.2f", NSDecimalNumber(decimal: cost.totalCost).doubleValue))")
                        .font(.body)
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                }
                
                // Cost Per Serving
                if let costPerServing = cost.costPerServing {
                    Divider()
                    HStack {
                        Text("Per Serving")
                            .font(.body)
                            .foregroundColor(.primary)
                        Spacer()
                        Text("£\(String(format: "%.2f", NSDecimalNumber(decimal: costPerServing).doubleValue))")
                            .font(.body)
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                }
                
                // Food Cost Percentage
                if let foodCostPercentage = cost.foodCostPercentage {
                    Divider()
                    HStack {
                        Text("Food Cost %")
                            .font(.body)
                            .foregroundColor(.primary)
                        Spacer()
                        Text("\(String(format: "%.1f", NSDecimalNumber(decimal: foodCostPercentage).doubleValue))%")
                            .font(.body)
                            .fontWeight(.semibold)
                            .foregroundColor(foodCostPercentage > 30 ? .orange : .green)
                    }
                }
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [Color.green.opacity(0.05), Color.green.opacity(0.02)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.green.opacity(0.2), lineWidth: 1)
        )
    }
}

// MARK: - Steps View

struct StepsView: View {
    let recipeDetail: RecipeDetail
    @State private var currentStepIndex = 0
    
    var body: some View {
        VStack(spacing: 20) {
            if !recipeDetail.steps.isEmpty {
                // Current Step Card
                StepCard(step: recipeDetail.steps[currentStepIndex])
                
                // Step Navigation
                StepNavigation(
                    currentIndex: $currentStepIndex,
                    totalSteps: recipeDetail.steps.count
                )
            }
        }
    }
}

struct StepCard: View {
    let step: RecipeStep
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Step \(step.stepNumber)")
                    .font(.title3)
                    .fontWeight(.bold)
                
                Spacer()
                
                if let temperature = step.temperature {
                    Label("\(temperature)°C", systemImage: "thermometer")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                if let duration = step.duration {
                    Label("\(duration) min", systemImage: "clock")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            
            Text(step.instruction)
                .font(.body)
                .foregroundColor(.primary)
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct StepNavigation: View {
    @Binding var currentIndex: Int
    let totalSteps: Int
    
    var body: some View {
        HStack {
            Button(action: {
                if currentIndex > 0 {
                    currentIndex -= 1
                }
            }) {
                Image(systemName: "chevron.left")
                    .font(.headline)
                    .foregroundColor(currentIndex > 0 ? .green : .gray)
            }
            .disabled(currentIndex == 0)
            
            Spacer()
            
            Text("\(currentIndex + 1) of \(totalSteps)")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Button(action: {
                if currentIndex < totalSteps - 1 {
                    currentIndex += 1
                }
            }) {
                Image(systemName: "chevron.right")
                    .font(.headline)
                    .foregroundColor(currentIndex < totalSteps - 1 ? .green : .gray)
            }
            .disabled(currentIndex >= totalSteps - 1)
        }
        .padding()
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Edit Recipe View

struct EditRecipeView: View {
    let recipeId: String
    let recipeDetail: RecipeDetail
    
    var body: some View {
        NavigationLink(destination: RecipeEditView(recipeId: recipeId)) {
            HStack {
                Text("Tap to edit recipe")
                    .font(.body)
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
}

// MARK: - Error & Empty States

struct ErrorView: View {
    let message: String
    let onRetry: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundColor(.orange)
            
            Text("Error")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            Button("Retry", action: onRetry)
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

struct EmptyStateView: View {
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text")
                .font(.largeTitle)
                .foregroundColor(.secondary)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

