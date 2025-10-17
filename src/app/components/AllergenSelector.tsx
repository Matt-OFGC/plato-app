"use client";

import { useState } from "react";

interface AllergenSelectorProps {
  selectedAllergens: string[];
  onChange: (allergens: string[]) => void;
  className?: string;
}

const COMMON_ALLERGENS = [
  "Gluten",
  "Dairy",
  "Eggs",
  "Nuts",
  "Peanuts",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Mustard",
  "Celery",
  "Lupin",
  "Sulphites",
  "Molluscs",
];

export function AllergenSelector({ selectedAllergens, onChange, className = "" }: AllergenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAllergen, setCustomAllergen] = useState("");

  const handleAllergenToggle = (allergen: string) => {
    if (selectedAllergens.includes(allergen)) {
      onChange(selectedAllergens.filter(a => a !== allergen));
    } else {
      onChange([...selectedAllergens, allergen]);
    }
  };

  const handleAddCustomAllergen = () => {
    if (customAllergen.trim() && !selectedAllergens.includes(customAllergen.trim())) {
      onChange([...selectedAllergens, customAllergen.trim()]);
      setCustomAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    onChange(selectedAllergens.filter(a => a !== allergen));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-semibold text-gray-900">Allergens</label>
      
      {/* Selected Allergens */}
      {selectedAllergens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAllergens.map((allergen) => (
            <span
              key={allergen}
              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
            >
              {allergen}
              <button
                type="button"
                onClick={() => handleRemoveAllergen(allergen)}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Allergen Selection */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors cursor-pointer bg-white text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedAllergens.length === 0 ? "Select allergens..." : `${selectedAllergens.length} selected`}
            </span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {COMMON_ALLERGENS.map((allergen) => (
                  <label
                    key={allergen}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAllergens.includes(allergen)}
                      onChange={() => handleAllergenToggle(allergen)}
                      className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-900">{allergen}</span>
                  </label>
                ))}
              </div>
              
              {/* Custom Allergen Input */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAllergen}
                    onChange={(e) => setCustomAllergen(e.target.value)}
                    placeholder="Add custom allergen..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAllergen())}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAllergen}
                    disabled={!customAllergen.trim()}
                    className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
