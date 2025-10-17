"use client";

import { useState } from "react";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";
import { SupplierSelector } from "@/components/SupplierSelector";

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
  description?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  deliveryDays: string[];
  deliveryNotes?: string | null;
  accountLogin?: string | null;
  accountPassword?: string | null;
  accountNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  currency?: string | null;
  paymentTerms?: string | null;
  minimumOrder?: number | null;
}

interface IngredientFormProps {
  companyId?: number;
  suppliers?: Supplier[];
  initialData?: {
    name?: string;
    supplier?: string;
    supplierId?: number;
    packQuantity?: number;
    packUnit?: string;
    packPrice?: number;
    densityGPerMl?: number;
    notes?: string;
    allergens?: string[];
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
    if (value.trim()) {
      setAllergens(prev => [...prev, value.trim()]);
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
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {companyId == null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              No company found for your account; items will be created without company scoping.
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Ingredient Name</label>
          <input 
            name="name" 
            defaultValue={initialData?.name}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
            placeholder="e.g., Cheddar Cheese"
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Supplier</label>
          <SupplierSelector
            suppliers={suppliers}
            value={selectedSupplierId}
            onChange={setSelectedSupplierId}
            placeholder="Select or create supplier..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Quantity</label>
            <input 
              type="number" 
              step="any" 
              name="packQuantity" 
              defaultValue={initialData?.packQuantity}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
              placeholder="5"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Unit</label>
            <select 
              name="packUnit" 
              defaultValue={initialData?.packUnit || "kg"}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
            >
              <optgroup label="Weight/Mass">
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="mg">Milligrams (mg)</option>
                <option value="lb">Pounds (lb)</option>
                <option value="oz">Ounces (oz)</option>
              </optgroup>
              <optgroup label="Volume">
                <option value="ml">Milliliters (ml)</option>
                <option value="l">Liters (l)</option>
                <option value="tsp">Teaspoons (tsp)</option>
                <option value="tbsp">Tablespoons (tbsp)</option>
                <option value="cup">Cups</option>
                <option value="floz">Fluid Ounces (fl oz)</option>
                <option value="pint">Pints</option>
                <option value="quart">Quarts</option>
                <option value="gallon">Gallons</option>
              </optgroup>
              <optgroup label="Count/Discrete">
                <option value="each">Each</option>
                <option value="slices">Slices</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Price (GBP)</label>
            <input 
              type="number" 
              step="any" 
              name="packPrice" 
              defaultValue={initialData?.packPrice}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
              placeholder="31.45"
              required 
            />
          </div>
        </div>
        
        <input type="hidden" name="currency" value="GBP" />
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Density (g/ml) - Optional</label>
          <p className="text-sm text-gray-600 mb-2">Used for converting between volume and weight measurements</p>
          <input 
            type="number" 
            step="any" 
            name="densityGPerMl" 
            defaultValue={initialData?.densityGPerMl}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
            placeholder="e.g., 0.95 for olive oil"
          />
          <div className="mt-3">
            <UnitConversionHelp />
          </div>
        </div>

        {/* Enhanced Allergen System */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🚀</span>
            <label className="block text-lg font-bold text-green-800">
              ENHANCED ALLERGEN SYSTEM - NEW FEATURE!
            </label>
          </div>
          <p className="text-sm text-green-700 mb-4">
            Select allergens for this ingredient. When you select "Nuts", you can specify exact nut types!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ALLERGEN_OPTIONS.map((allergen) => (
              <label key={allergen} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={allergen === "Other" ? showOtherInput : allergens.includes(allergen)}
                  onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{allergen}</span>
              </label>
            ))}
          </div>
          
          {/* Other Allergen Input */}
          {showOtherInput && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Specify Other Allergen:
              </label>
              <input
                type="text"
                value={otherAllergen}
                onChange={(e) => handleOtherAllergenChange(e.target.value)}
                placeholder="e.g., Lupin, Buckwheat, etc."
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-blue-600 mt-1">
                Enter any allergen not listed above
              </p>
            </div>
          )}
        </div>

        {/* Specific Nut Types */}
        {allergens.includes("Nuts") && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-4 border-yellow-400 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">🥜</span>
              <label className="block text-xl font-bold text-yellow-800">
                SPECIFIC NUT TYPES - SELECT EXACT TYPES!
              </label>
            </div>
            <p className="text-lg text-yellow-700 mb-4 font-semibold">
              🎉 This is the NEW enhanced feature! Select the specific types of nuts. 
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
        
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
          <textarea 
            name="notes" 
            defaultValue={initialData?.notes}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
            rows={3}
            placeholder="Any additional notes about this ingredient..."
          />
        </div>
        
        <div className="flex items-center gap-4 pt-4">
          <button 
            type="submit" 
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Ingredient
          </button>
        </div>
      </form>
    </div>
  );
}
