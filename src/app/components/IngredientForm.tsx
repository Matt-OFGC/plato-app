"use client";

import React, { useState } from "react";
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
  "Peanuts",
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

interface CustomConversion {
  unit: string;
  value: number;
  targetUnit: string;
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
    customConversions?: string;
  };
  onSubmit: (formData: FormData) => void;
}

export function IngredientForm({ companyId, suppliers = [], initialData, onSubmit }: IngredientFormProps) {
  const [allergens, setAllergens] = useState<string[]>(initialData?.allergens || []);
  const [selectedNutTypes, setSelectedNutTypes] = useState<string[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(initialData?.supplierId || null);
  const [otherAllergen, setOtherAllergen] = useState<string>("");
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false);
  const [otherNutType, setOtherNutType] = useState<string>("");
  const [showOtherNutInput, setShowOtherNutInput] = useState<boolean>(false);
  
  // Parse initial custom conversions
  const initialConversions: CustomConversion[] = initialData?.customConversions 
    ? (() => {
        try {
          const parsed = JSON.parse(initialData.customConversions);
          return Object.entries(parsed).map(([unit, data]: [string, any]) => ({
            unit,
            value: data.value,
            targetUnit: data.unit
          }));
        } catch {
          return [];
        }
      })()
    : [];
  
  const [customConversions, setCustomConversions] = useState<CustomConversion[]>(initialConversions);

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

  const addCustomConversion = () => {
    setCustomConversions(prev => [...prev, { unit: "tsp", value: 1, targetUnit: "ml" }]);
  };

  const removeCustomConversion = (index: number) => {
    setCustomConversions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomConversion = (index: number, field: keyof CustomConversion, value: string | number) => {
    setCustomConversions(prev => prev.map((conv, i) => 
      i === index ? { ...conv, [field]: value } : conv
    ));
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    
    // Combine allergens and nut types
    const allAllergens = [...allergens];
    const nutTypesToAdd = [...selectedNutTypes];
    
    // Add custom "Other" nut type if provided
    if (showOtherNutInput && otherNutType.trim()) {
      nutTypesToAdd.push(otherNutType.trim());
    }
    
    if (nutTypesToAdd.length > 0) {
      // Replace "Nuts" with specific nut types
      const allergensWithoutNuts = allAllergens.filter(a => a !== "Nuts");
      allAllergens.splice(0, allAllergens.length, ...allergensWithoutNuts, ...nutTypesToAdd);
    }
    
    const formData = new FormData(ev.currentTarget);
    formData.set("allergens", JSON.stringify(allAllergens));
    
    // Serialize custom conversions to JSON
    if (customConversions.length > 0) {
      const conversionsObj = customConversions.reduce((acc, conv) => {
        acc[conv.unit] = { value: conv.value, unit: conv.targetUnit };
        return acc;
      }, {} as Record<string, { value: number; unit: string }>);
      formData.set("customConversions", JSON.stringify(conversionsObj));
    }
    
    if (selectedSupplierId) {
      formData.set("supplierId", selectedSupplierId.toString());
    }
    onSubmit(formData);
  };

  return (
    <div>
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-6">
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
            <select
              id="packUnit"
              name="packUnit"
              defaultValue={initialData?.packUnit || ""}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="">Select a unit...</option>
              <optgroup label="Weight/Mass">
                <option value="g">g (grams)</option>
                <option value="kg">kg (kilograms)</option>
                <option value="mg">mg (milligrams)</option>
                <option value="lb">lb (pounds)</option>
                <option value="oz">oz (ounces)</option>
              </optgroup>
              <optgroup label="Volume (Liquid)">
                <option value="ml">ml (milliliters)</option>
                <option value="l">l (liters)</option>
                <option value="tsp">tsp (teaspoons)</option>
                <option value="tbsp">tbsp (tablespoons)</option>
                <option value="cup">cup</option>
                <option value="floz">fl oz (fluid ounces)</option>
                <option value="pint">pint</option>
                <option value="quart">quart</option>
                <option value="gallon">gallon</option>
                <option value="pinch">pinch</option>
                <option value="dash">dash</option>
              </optgroup>
              <optgroup label="Count/Discrete">
                <option value="each">each</option>
                <option value="slices">slices</option>
              </optgroup>
              <optgroup label="Size-based">
                <option value="large">large</option>
                <option value="medium">medium</option>
                <option value="small">small</option>
              </optgroup>
            </select>
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
            placeholder="e.g., 25.00 (use 0 for free ingredients like water)"
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

        {/* Custom Unit Conversions */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="block text-lg font-bold text-blue-800">
                Custom Unit Conversions (Optional)
              </label>
              <p className="text-sm text-blue-700 mt-1">
                Define how recipe units (tsp, tbsp, cup, etc.) convert to your purchase unit. 
                Example: If you buy vanilla extract in 100ml bottles but recipes use teaspoons, 
                you can specify "1 tsp = 5 ml" here.
              </p>
            </div>
          </div>

          {customConversions.length > 0 && (
            <div className="space-y-3 mb-4">
              {customConversions.map((conversion, index) => (
                <div key={index} className="flex gap-2 items-center bg-white p-3 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-gray-700">1</span>
                  <select
                    value={conversion.unit}
                    onChange={(e) => updateCustomConversion(index, 'unit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="cup">cup</option>
                    <option value="floz">fl oz</option>
                    <option value="pint">pint</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                  </select>
                  <span className="text-sm font-medium text-gray-700">=</span>
                  <input
                    type="number"
                    value={conversion.value}
                    onChange={(e) => updateCustomConversion(index, 'value', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="5"
                  />
                  <select
                    value={conversion.targetUnit}
                    onChange={(e) => updateCustomConversion(index, 'targetUnit', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCustomConversion(index)}
                    className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove conversion"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addCustomConversion}
            className="flex items-center gap-2 px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border-2 border-dashed border-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Conversion Rule
          </button>
          
          {customConversions.length === 0 && (
            <p className="text-xs text-blue-600 mt-3 italic">
              💡 Tip: Add conversion rules if you buy this ingredient in one unit (like ml or g) 
              but use it in recipes with different units (like tsp or cups).
            </p>
          )}
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Allergens
          </label>
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
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Specific Nut Types
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Select the specific types to replace the generic "Nuts" allergen)
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
              {NUT_TYPES.map((nutType) => (
                <label key={nutType} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    id={`nut-type-${nutType.toLowerCase().replace(/\s+/g, '-')}`}
                    name={`nutType-${nutType}`}
                    checked={selectedNutTypes.includes(nutType)}
                    onChange={(e) => handleNutTypeChange(nutType, e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{nutType}</span>
                </label>
              ))}
            </div>
            
            {/* Other Nut Type Option */}
            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOtherNutInput}
                  onChange={(e) => {
                    setShowOtherNutInput(e.target.checked);
                    if (!e.target.checked) {
                      setOtherNutType("");
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 font-medium">Other (specify)</span>
              </label>
              {showOtherNutInput && (
                <input
                  type="text"
                  value={otherNutType}
                  onChange={(e) => setOtherNutType(e.target.value)}
                  placeholder="e.g., Tiger nuts, Candlenuts..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              )}
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
      </form>
    </div>
  );
}