"use client";

import { useState, useEffect } from "react";
import { Unit } from "@/lib/units";

interface Supplier {
  id: number;
  name: string;
  minimumOrder: number | null;
}

interface IngredientFormProps {
  companyId?: number;
  suppliers: Supplier[];
  onSubmit: (formData: FormData) => void | Promise<void>;
  initialData?: {
    name?: string;
    supplier?: string;
    supplierId?: number;
    packQuantity?: number;
    packUnit?: Unit;
    packPrice?: number;
    currency?: string;
    densityGPerMl?: number | null;
    allergens?: string[];
    notes?: string;
  };
}

const ALLERGEN_OPTIONS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame seeds",
  "Soya",
  "Sulphur dioxide/sulphites"
];

const NUT_TYPES = [
  "Almonds",
  "Brazil nuts",
  "Cashews",
  "Hazelnuts",
  "Macadamia nuts",
  "Pecans",
  "Pistachios",
  "Walnuts",
  "Mixed nuts"
];

export function IngredientForm({ companyId, suppliers, onSubmit, initialData }: IngredientFormProps) {
  console.log('🚨🚨🚨 ENHANCED ALLERGEN SYSTEM LOADED - VERSION 3.0 - ' + new Date().toISOString() + ' 🚨🚨🚨');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    supplier: initialData?.supplier || "",
    supplierId: initialData?.supplierId || "",
    packQuantity: initialData?.packQuantity || 1,
    packUnit: initialData?.packUnit || "g" as Unit,
    packPrice: initialData?.packPrice || 0,
    currency: initialData?.currency || "GBP",
    densityGPerMl: initialData?.densityGPerMl || "",
    allergens: initialData?.allergens || [],
    nutTypes: [] as string[],
    notes: initialData?.notes || "",
  });

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(formData.allergens);
  const [selectedNutTypes, setSelectedNutTypes] = useState<string[]>(formData.nutTypes);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    if (checked) {
      setSelectedAllergens(prev => [...prev, allergen]);
    } else {
      setSelectedAllergens(prev => prev.filter(a => a !== allergen));
      // If "Nuts" is unchecked, also clear nut types
      if (allergen === "Nuts") {
        setSelectedNutTypes([]);
      }
    }
  };

  const handleNutTypeChange = (nutType: string, checked: boolean) => {
    if (checked) {
      setSelectedNutTypes(prev => [...prev, nutType]);
    } else {
      setSelectedNutTypes(prev => prev.filter(n => n !== nutType));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine allergens and nut types
    const allAllergens = [...selectedAllergens];
    if (selectedNutTypes.length > 0) {
      // Replace "Nuts" with specific nut types
      const allergensWithoutNuts = allAllergens.filter(a => a !== "Nuts");
      allAllergens.splice(0, allAllergens.length, ...allergensWithoutNuts, ...selectedNutTypes);
    }

    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("supplier", formData.supplier);
    formDataObj.append("supplierId", formData.supplierId.toString());
    formDataObj.append("packQuantity", formData.packQuantity.toString());
    formDataObj.append("packUnit", formData.packUnit);
    formDataObj.append("packPrice", formData.packPrice.toString());
    formDataObj.append("currency", formData.currency);
    formDataObj.append("densityGPerMl", formData.densityGPerMl.toString());
    formDataObj.append("allergens", JSON.stringify(allAllergens));
    formDataObj.append("notes", formData.notes);

    onSubmit(formDataObj);
  };

  return (
    <div>
      {/* Enhanced System Alert */}
      <div className="bg-gradient-to-r from-red-500 to-yellow-500 text-white p-6 rounded-lg mb-6 border-4 border-black">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🚨</span>
          <div>
            <h3 className="text-2xl font-bold">ENHANCED ALLERGEN SYSTEM IS ACTIVE! - VERSION 3.0</h3>
            <p className="text-yellow-100 text-lg">You now have access to specific nut type selection and improved allergen management.</p>
            <p className="text-yellow-200 text-sm mt-2">If you can see this RED/YELLOW banner, the enhanced system is working!</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Ingredient Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Organic Flour"
          />
        </div>

        {/* Supplier */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
            Supplier
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pack Quantity */}
        <div>
          <label htmlFor="packQuantity" className="block text-sm font-medium text-gray-700 mb-2">
            Pack Quantity *
          </label>
          <input
            type="number"
            id="packQuantity"
            name="packQuantity"
            value={formData.packQuantity}
            onChange={handleInputChange}
            required
            min="0.01"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Pack Unit */}
        <div>
          <label htmlFor="packUnit" className="block text-sm font-medium text-gray-700 mb-2">
            Pack Unit *
          </label>
          <select
            id="packUnit"
            name="packUnit"
            value={formData.packUnit}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="g">Grams (g)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="mg">Milligrams (mg)</option>
            <option value="lb">Pounds (lb)</option>
            <option value="oz">Ounces (oz)</option>
            <option value="ml">Milliliters (ml)</option>
            <option value="l">Liters (l)</option>
            <option value="tsp">Teaspoons (tsp)</option>
            <option value="tbsp">Tablespoons (tbsp)</option>
            <option value="cup">Cups</option>
            <option value="floz">Fluid Ounces (fl oz)</option>
            <option value="pint">Pints</option>
            <option value="quart">Quarts</option>
            <option value="gallon">Gallons</option>
            <option value="each">Each</option>
            <option value="slices">Slices</option>
          </select>
        </div>

        {/* Pack Price */}
        <div>
          <label htmlFor="packPrice" className="block text-sm font-medium text-gray-700 mb-2">
            Pack Price *
          </label>
          <input
            type="number"
            id="packPrice"
            name="packPrice"
            value={formData.packPrice}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
            Currency *
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Density */}
        <div>
          <label htmlFor="densityGPerMl" className="block text-sm font-medium text-gray-700 mb-2">
            Density (g/ml)
          </label>
          <input
            type="number"
            id="densityGPerMl"
            name="densityGPerMl"
            value={formData.densityGPerMl}
            onChange={handleInputChange}
            min="0"
            step="0.001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 1.0 for water"
          />
          <p className="text-xs text-gray-500 mt-1">Leave empty if not applicable</p>
        </div>
      </div>

      {/* Allergens */}
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚀</span>
          <label className="block text-lg font-bold text-green-800">
            ENHANCED ALLERGEN SYSTEM - NEW FEATURE!
          </label>
        </div>
        <p className="text-sm text-green-700 mb-4">
          This is the new enhanced allergen system with specific nut type selection. 
          If you can see this green box, the system is working!
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALLERGEN_OPTIONS.map((allergen) => (
            <label key={allergen} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAllergens.includes(allergen)}
                onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{allergen}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Specific Nut Types */}
      {selectedAllergens.includes("Nuts") && (
        <div className="bg-yellow-100 border-4 border-yellow-400 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🥜</span>
            <label className="block text-xl font-bold text-yellow-800">
              SPECIFIC NUT TYPES - ENHANCED FEATURE!
            </label>
          </div>
          <p className="text-lg text-yellow-700 mb-4 font-semibold">
            🎉 This is the NEW enhanced feature! Select specific nut types below. 
            This will replace the generic "Nuts" entry with the specific nut types you choose.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {NUT_TYPES.map((nutType) => (
              <label key={nutType} className="flex items-center space-x-2 bg-white p-2 rounded border">
                <input
                  type="checkbox"
                  checked={selectedNutTypes.includes(nutType)}
                  onChange={(e) => handleNutTypeChange(nutType, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">{nutType}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Additional notes about this ingredient..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save Ingredient
        </button>
      </div>
      </form>
    </div>
  );
}
