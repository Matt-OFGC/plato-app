import SwiftUI
import PlatoShared

struct IngredientEditView: View {
    let ingredientId: String?
    @Environment(\.dismiss) var dismiss
    
    @State private var name: String = ""
    @State private var supplier: String = ""
    @State private var supplierId: String = ""
    @State private var packQuantity: String = "1"
    @State private var packUnit: String = "each"
    @State private var packPrice: String = "0.00"
    @State private var currency: String = "GBP"
    @State private var densityGPerMl: String = ""
    @State private var allergens: [String] = []
    @State private var notes: String = ""
    
    @State private var isLoading = false
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var availableSuppliers: [Supplier] = []
    
    var isNewIngredient: Bool {
        ingredientId == nil
    }
    
    var body: some View {
        NavigationView {
            Form {
                // Basic Info Section
                Section(header: Text("Basic Information")) {
                    TextField("Ingredient Name", text: $name)
                        .autocapitalization(.words)
                    
                    Picker("Supplier", selection: $supplierId) {
                        Text("None").tag("")
                        ForEach(availableSuppliers, id: \.id) { supplier in
                            Text(supplier.name).tag(String(supplier.id))
                        }
                    }
                    
                    if supplierId.isEmpty {
                        TextField("Supplier Name", text: $supplier)
                            .autocapitalization(.words)
                    }
                }
                
                // Pricing Section
                Section(header: Text("Pricing")) {
                    HStack {
                        TextField("Pack Quantity", text: $packQuantity)
                            .keyboardType(.decimalPad)
                        
                        Picker("Unit", selection: $packUnit) {
                            Text("g").tag("g")
                            Text("kg").tag("kg")
                            Text("mg").tag("mg")
                            Text("lb").tag("lb")
                            Text("oz").tag("oz")
                            Text("ml").tag("ml")
                            Text("l").tag("l")
                            Text("tsp").tag("tsp")
                            Text("tbsp").tag("tbsp")
                            Text("cup").tag("cup")
                            Text("floz").tag("floz")
                            Text("each").tag("each")
                            Text("slices").tag("slices")
                        }
                    }
                    
                    TextField("Pack Price (£)", text: $packPrice)
                        .keyboardType(.decimalPad)
                    
                    Picker("Currency", selection: $currency) {
                        Text("GBP (£)").tag("GBP")
                        Text("USD ($)").tag("USD")
                        Text("EUR (€)").tag("EUR")
                    }
                }
                
                // Advanced Section
                Section(header: Text("Advanced")) {
                    TextField("Density (g/ml)", text: $densityGPerMl)
                        .keyboardType(.decimalPad)
                        .help("Used for volume to weight conversions")
                    
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                // Allergens Section
                Section(header: Text("Allergens")) {
                    let commonAllergens = ["Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish", "Sesame"]
                    
                    ForEach(commonAllergens, id: \.self) { allergen in
                        Toggle(allergen, isOn: Binding(
                            get: { allergens.contains(allergen) },
                            set: { isOn in
                                if isOn {
                                    if !allergens.contains(allergen) {
                                        allergens.append(allergen)
                                    }
                                } else {
                                    allergens.removeAll { $0 == allergen }
                                }
                            }
                        ))
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
            .navigationTitle(isNewIngredient ? "New Ingredient" : "Edit Ingredient")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Saving..." : "Save") {
                        saveIngredient()
                    }
                    .disabled(isSaving || name.isEmpty)
                }
            }
            .task {
                if !isNewIngredient, let id = ingredientId {
                    loadIngredient(id: id)
                }
                loadSuppliers()
            }
        }
    }
    
    private func loadIngredient(id: String) {
        isLoading = true
        
        Task {
            do {
                let ingredient = try await IngredientService.shared.getIngredient(id: id)
                
                await MainActor.run {
                    self.name = ingredient.name
                    self.supplier = ingredient.supplier ?? ""
                    self.supplierId = ingredient.supplierId.map { String($0) } ?? ""
                    self.packQuantity = ingredient.packQuantity
                    self.packUnit = ingredient.originalUnit
                    self.packPrice = ingredient.packPrice
                    self.currency = ingredient.currency
                    self.densityGPerMl = ingredient.densityGPerMl ?? ""
                    self.allergens = ingredient.allergens
                    self.notes = ingredient.notes ?? ""
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
    
    private func loadSuppliers() {
        // TODO: Implement supplier loading when SupplierService is created
        // For now, leave empty
    }
    
    private func saveIngredient() {
        isSaving = true
        errorMessage = nil
        
        Task {
            do {
                if isNewIngredient {
                    let request = CreateIngredientRequest(
                        name: name,
                        supplier: supplier.isEmpty ? nil : supplier,
                        supplierId: supplierId.isEmpty ? nil : supplierId,
                        packQuantity: packQuantity,
                        packUnit: packUnit,
                        packPrice: packPrice,
                        currency: currency,
                        densityGPerMl: densityGPerMl.isEmpty ? nil : densityGPerMl,
                        allergens: allergens.isEmpty ? nil : allergens,
                        notes: notes.isEmpty ? nil : notes
                    )
                    
                    _ = try await IngredientService.shared.createIngredient(request)
                    
                    await MainActor.run {
                        isSaving = false
                        dismiss()
                    }
                } else if let id = ingredientId {
                    let request = UpdateIngredientRequest(
                        name: name,
                        supplier: supplier.isEmpty ? nil : supplier,
                        supplierId: supplierId.isEmpty ? nil : supplierId,
                        packQuantity: packQuantity,
                        packUnit: packUnit,
                        packPrice: packPrice,
                        currency: currency,
                        densityGPerMl: densityGPerMl.isEmpty ? nil : densityGPerMl,
                        allergens: allergens.isEmpty ? nil : allergens,
                        notes: notes.isEmpty ? nil : notes
                    )
                    
                    _ = try await IngredientService.shared.updateIngredient(id: id, request)
                    
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

// Temporary Supplier model until we create SupplierService
struct Supplier: Identifiable {
    let id: Int
    let name: String
}




