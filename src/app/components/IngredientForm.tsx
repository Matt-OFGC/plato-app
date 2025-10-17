"use client";

import { useState } from "react";
import { UnitConversionHelp } from "./UnitConversionHelp";
import { SupplierSelector } from "./SupplierSelector";

const ALLERGEN_OPTIONS = [
  "Celery",
  "Gluten",
  "Eggs",
  "Fish",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame",
  "Soya",
  "Sulphites",
  "Other"
];

const NUT_TYPES = [
  "Almonds",
  "Brazil nuts",
  "Cashews",
  "Hazelnuts",
  "Macadamia nuts",
  "Pecans",
  "Pine nuts",
  "Pistachios",
  "Walnuts",
  "Mixed nuts"
];

interface Supplier {
  id: number;
  name: string;
  deliveryDays: string[];
  [key: string]: any; // Allow additional properties
}

interface IngredientFormProps {
  companyId: number;
  suppliers?: Supplier[];
  initialData?: {
    name?: string;
    description?: string;
    packQuantity?: number;
    packUnit?: string;
    packPrice?: number;
    yieldQuantity?: number;
    yieldUnit?: string;
    densityGPerMl?: number;
    allergens?: string[];
    notes?: string;
    supplierId?: number;
  };
  onSubmit: (formData: FormData) => void;
}

export function IngredientForm({ companyId, suppliers = [], initialData, onSubmit }: IngredientFormProps) {
  const [allergens, setAllergens] = useState<string[]>(initialData?.allergens || []);
  const [selectedNutTypes, setSelectedNutTypes] = useState<string[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(initialData?.supplierId || null);
  const [otherAllergen, setOtherAllergen] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false);

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    if (checked) {
      if (allergen === "Other") {
        setShowOtherInput(true);
      } else {
        setAllergens(prev => [...prev, allergen]);
      }
    } else {
      if (allergen === "Other") {
        setShowOtherInput(false);
        setOtherAllergen("");
        setAllergens(prev => prev.filter(a => a !== otherAllergen));
      } else {
        setAllergens(prev => prev.filter(a => a !== allergen));
        // If "Nuts" is unchecked, also clear nut types
        if (allergen === "Nuts") {
          setSelectedNutTypes([]);
        }
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

  const handleOtherAllergenChange = (value: string) => {
    setOtherAllergen(value);
    // Remove the previous "other" allergen if it exists
    const previousOther = allergens.find(a => !ALLERGEN_OPTIONS.includes(a) && a !== "Other");
    if (previousOther) {
      setAllergens(prev => prev.filter(a => a !== previousOther));
    }
    // Add the new "other" allergen if it has a value
    if (value && !allergens.includes(value)) {
      setAllergens(prev => [...prev, value]);
    }
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    
    // Combine allergens and nut types
    const allAllergens = [...allergens];
    if (selectedNutTypes.length > 0) {
      // Replace "Nuts" with specific nut types
      const allergensWithoutNuts = allAllergens.filter(a => a !== "Nuts");
      allAllergens.splice(0, allAllergens.length, ...allergensWithoutNuts, ...selectedNutTypes);
    }
    
    const formData = new FormData(ev.currentTarget);
    formData.set("allergens", JSON.stringify(allAllergens));
    if (selectedSupplierId) {
      formData.set("supplierId", selectedSupplierId.toString());
    }
    onSubmit(formData);
  };

  return (
    <div>
      {/* Enhanced System Alert */}
      <div className="bg-gradient-to-r from-red-500 to-yellow-500 text-white p-6 rounded-lg mb-6 border-4 border-black">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🚨</span>
          <div>
            <h3 className="text-2xl font-bold">ENHANCED ALLERGEN SYSTEM IS ACTIVE! - VERSION 3.0</h3>
            <p className="text-yellow-100">You now have access to specific nut type selection and improved allergen management.</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="ingredient-name" className="block text-sm font-medium text-gray-900 mb-2">
            Ingredient Name
          </label>
          <input
            type="text"
            id="ingredient-name"
            name="name"
            defaultValue={initialData?.name || ""}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., All-Purpose Flour"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initialData?.description || ""}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., Bleached, enriched, pre-sifted"
          ></textarea>
        </div>

        {/* Pack Quantity & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="packQuantity" className="block text-sm font-medium text-gray-900 mb-2">
              Pack Quantity
            </label>
            <input
              type="number"
              id="packQuantity"
              name="packQuantity"
              step="0.01"
              min="0"
              defaultValue={initialData?.packQuantity || ""}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="e.g., 25"
            />
          </div>
          <div>
            <label htmlFor="packUnit" className="block text-sm font-medium text-gray-900 mb-2">
              Pack Unit
            </label>
            <input
              type="text"
              id="packUnit"
              name="packUnit"
              defaultValue={initialData?.packUnit || ""}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="e.g., kg, lbs, each"
            />
          </div>
        </div>

        {/* Pack Price */}
        <div>
          <label htmlFor="packPrice" className="block text-sm font-medium text-gray-900 mb-2">
            Pack Price
          </label>
          <input
            type="number"
            id="packPrice"
            name="packPrice"
            step="0.01"
            min="0"
            defaultValue={initialData?.packPrice || ""}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., 25.00"
          />
        </div>

        {/* Yield Quantity & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="yieldQuantity" className="block text-sm font-medium text-gray-900 mb-2">
              Yield Quantity (Optional)
            </label>
            <input
              type="number"
              id="yieldQuantity"
              name="yieldQuantity"
              step="0.01"
              min="0"
              defaultValue={initialData?.yieldQuantity || ""}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="e.g., 1"
            />
          </div>
          <div>
            <label htmlFor="yieldUnit" className="block text-sm font-medium text-gray-900 mb-2">
              Yield Unit (Optional)
            </label>
            <input
              type="text"
              id="yieldUnit"
              name="yieldUnit"
              defaultValue={initialData?.yieldUnit || ""}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="e.g., kg, liter, each"
            />
          </div>
        </div>

        {/* Density */}
        <div>
          <label htmlFor="densityGPerMl" className="block text-sm font-medium text-gray-900 mb-2">
            Density (g/ml) (Optional)
            <UnitConversionHelp />
          </label>
          <input
            type="number"
            id="densityGPerMl"
            name="densityGPerMl"
            step="0.001"
            min="0"
            defaultValue={initialData?.densityGPerMl || ""}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., 1.0 (for water)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for converting between weight and volume (e.g., ml to grams).
          </p>
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
                  checked={allergens.includes(allergen) || (allergen === "Other" && showOtherInput)}
                  onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{allergen}</span>
              </label>
            ))}
          </div>

          {/* Other Allergen Input */}
          {showOtherInput && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <label htmlFor="other-allergen" className="block text-sm font-medium text-blue-800 mb-2">
                Specify "Other" Allergen:
              </label>
              <input
                id="other-allergen"
                name="otherAllergen"
                type="text"
                value={otherAllergen}
                onChange={(e) => handleOtherAllergenChange(e.target.value)}
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Lupin, Buckwheat, etc."
              />
              <p className="text-xs text-blue-700 mt-1">
                Enter any allergen not listed above. This will be saved as a custom allergen.
              </p>
            </div>
          )}
        </div>

        {/* Specific Nut Types */}
        {allergens.includes("Nuts") && (
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
                    id={`nut-type-${nutType.toLowerCase().replace(/\s+/g, '-')}`}
                    name={`nutType-${nutType}`}
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

        {/* Supplier */}
        <div>
          <label htmlFor="supplierId" className="block text-sm font-medium text-gray-900 mb-2">
            Supplier (Optional)
          </label>
          <SupplierSelector
            suppliers={suppliers}
            value={selectedSupplierId}
            onChange={setSelectedSupplierId}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={initialData?.notes || ""}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="Any additional notes about this ingredient..."
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium"
        >
          Save Ingredient
        </button>
      </form>
    </div>
  );
}