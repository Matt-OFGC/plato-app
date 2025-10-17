"use client";

import { useState, useEffect, useRef } from "react";
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
  "Acorns",
  "Almonds",
  "Beech Nuts",
  "Brazil Nuts",
  "Butternuts (White Walnuts)",
  "Cashews",
  "Chestnuts",
  "Chilean Hazelnuts",
  "Chinese Chestnuts",
  "Coconuts",
  "Ginkgo Nuts",
  "Hazelnuts (Filberts)",
  "Karuka Nuts (Pandanus Nuts)",
  "Macadamia Nuts",
  "Marcona Almonds",
  "Mongongo Nuts (Manketti Nuts)",
  "Paradise Nuts (Sapucaia Nuts)",
  "Peanuts",
  "Pecans",
  "Pili Nuts",
  "Pine Nuts",
  "Pistachios",
  "Sacha Inchi (Inca Peanuts)",
  "Tiger Nuts (Chufa)",
  "Walnuts",
  "Mixed Nuts"
];

export function IngredientForm({ companyId, suppliers, onSubmit, initialData }: IngredientFormProps) {
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
  const [nutSearchTerm, setNutSearchTerm] = useState("");
  const [showNutDropdown, setShowNutDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleNutTypeSelect = (nutType: string) => {
    if (!selectedNutTypes.includes(nutType)) {
      setSelectedNutTypes(prev => [...prev, nutType]);
    }
    setNutSearchTerm("");
    setShowNutDropdown(false);
  };

  const removeNutType = (nutType: string) => {
    setSelectedNutTypes(prev => prev.filter(n => n !== nutType));
  };

  const filteredNutTypes = NUT_TYPES.filter(nutType =>
    nutType.toLowerCase().includes(nutSearchTerm.toLowerCase()) &&
    !selectedNutTypes.includes(nutType)
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNutDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-6">
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
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-xs">⚠</span>
          </div>
          <label className="text-lg font-semibold text-gray-900">
            Allergen Information
          </label>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Select all allergens present in this ingredient. When "Nuts" is selected, you'll be able to specify the exact nut types below.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ALLERGEN_OPTIONS.map((allergen) => (
            <label key={allergen} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAllergens.includes(allergen)}
                onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 font-medium">{allergen}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Specific Nut Types */}
      {selectedAllergens.includes("Nuts") && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 text-xs">🥜</span>
            </div>
            <label className="text-lg font-semibold text-amber-800">
              Specific Nut Types
            </label>
          </div>
          <p className="text-sm text-amber-700 mb-6">
            Search and select the specific types of nuts present. This will replace the generic "Nuts" entry with the specific nut types you choose.
          </p>
          
          {/* Searchable Dropdown */}
          <div className="relative mb-4" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for nut types..."
                value={nutSearchTerm}
                onChange={(e) => {
                  setNutSearchTerm(e.target.value);
                  setShowNutDropdown(true);
                }}
                onFocus={() => setShowNutDropdown(true)}
                className="w-full px-4 py-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            {/* Dropdown Results */}
            {showNutDropdown && nutSearchTerm && filteredNutTypes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredNutTypes.map((nutType) => (
                  <button
                    key={nutType}
                    type="button"
                    onClick={() => handleNutTypeSelect(nutType)}
                    className="w-full px-4 py-3 text-left hover:bg-amber-50 focus:bg-amber-50 focus:outline-none border-b border-amber-100 last:border-b-0"
                  >
                    <span className="text-sm text-gray-700">{nutType}</span>
                  </button>
                ))}
              </div>
            )}
            
            {showNutDropdown && nutSearchTerm && filteredNutTypes.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg p-4">
                <p className="text-sm text-gray-500">No nut types found matching "{nutSearchTerm}"</p>
              </div>
            )}
          </div>

          {/* Selected Nut Types */}
          {selectedNutTypes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Selected Nut Types:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNutTypes.map((nutType) => (
                  <span
                    key={nutType}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                  >
                    {nutType}
                    <button
                      type="button"
                      onClick={() => removeNutType(nutType)}
                      className="ml-1 text-amber-600 hover:text-amber-800 focus:outline-none"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
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

      </form>
    </div>
  );
}
