"use client";

import { useState } from "react";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";
import { AllergenSelector } from "@/components/AllergenSelector";
import { SupplierSelector } from "@/components/SupplierSelector";

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
  minimumOrder?: number | null | any;
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
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(initialData?.supplierId || null);

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const formData = new FormData(ev.currentTarget);
    formData.set("allergens", JSON.stringify(allergens));
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

        <AllergenSelector
          selectedAllergens={allergens}
          onChange={setAllergens}
        />
        
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
