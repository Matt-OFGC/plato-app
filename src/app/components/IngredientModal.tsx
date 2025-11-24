"use client";

import { useState, useEffect, useMemo } from "react";
import { IngredientForm } from "./IngredientForm";
import { createIngredient, updateIngredient, getSuppliers } from "@/app/dashboard/ingredients/actions";
import { fromBase, Unit, BaseUnit } from "@/lib/units";
import { RecentItemsTracker } from "./RecentItemsTracker";

const ALLERGEN_OPTIONS = [
  "Celery", "Gluten", "Eggs", "Fish", "Milk", "Molluscs",
  "Mustard", "Nuts", "Peanuts", "Sesame", "Soya", "Sulphites", "Other"
];

function AllergensSidebar({
  allergens,
  onAllergenChange,
  otherAllergen,
  onOtherAllergenChange,
  showOtherInput,
  onShowOtherInputChange,
}: {
  allergens: string[];
  onAllergenChange: (allergens: string[]) => void;
  otherAllergen: string;
  onOtherAllergenChange: (value: string) => void;
  showOtherInput: boolean;
  onShowOtherInputChange: (show: boolean) => void;
}) {
  const handleAllergenChange = (allergen: string, checked: boolean) => {
    if (allergen === "Other") {
      onShowOtherInputChange(checked);
      if (!checked) {
        onOtherAllergenChange("");
        onAllergenChange(allergens.filter(a => a !== "Other" && !ALLERGEN_OPTIONS.includes(a)));
      }
    } else {
      if (checked) {
        onAllergenChange([...allergens, allergen]);
      } else {
        onAllergenChange(allergens.filter(a => a !== allergen));
      }
    }
  };

  return (
    <div className="w-72 border-l-2 border-gray-300 bg-gradient-to-b from-gray-50 to-white p-5 flex-shrink-0 flex flex-col shadow-inner">
      <div className="mb-4 pb-3 border-b-2 border-gray-300">
        <label className="block text-sm font-bold text-gray-800 uppercase tracking-wider">
          Allergens
        </label>
        <p className="text-xs text-gray-500 mt-1">Select all that apply</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {ALLERGEN_OPTIONS.map((allergen) => (
          <label 
            key={allergen} 
            className={`flex items-center space-x-3 cursor-pointer p-2.5 rounded-lg transition-all ${
              allergens.includes(allergen) || (allergen === "Other" && showOtherInput)
                ? 'bg-emerald-50 border-2 border-emerald-300' 
                : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={allergens.includes(allergen) || (allergen === "Other" && showOtherInput)}
              onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 w-5 h-5 flex-shrink-0"
            />
            <span className={`text-sm font-medium ${
              allergens.includes(allergen) || (allergen === "Other" && showOtherInput)
                ? 'text-emerald-900' 
                : 'text-gray-700'
            }`}>
              {allergen}
            </span>
          </label>
        ))}
      </div>
      
      {showOtherInput && (
        <div className="mt-4 pt-4 border-t-2 border-gray-300">
          <label htmlFor="other-allergen-sidebar" className="block text-sm font-semibold text-emerald-800 mb-2">
            Specify Other Allergen:
          </label>
          <input
            id="other-allergen-sidebar"
            type="text"
            value={otherAllergen}
            onChange={(e) => onOtherAllergenChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
            placeholder="e.g., Lupin, Buckwheat..."
          />
        </div>
      )}
    </div>
  );
}

interface Supplier {
  id: number;
  name: string;
  deliveryDays: string[];
  [key: string]: any; // Allow additional properties
}

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: number;
  editIngredient?: {
    id: number;
    name: string;
    supplier?: string | null;
    supplierId?: number | null;
    packQuantity: number;
    packUnit: string;
    originalUnit?: Unit | null;
    packPrice: number;
    currency: string;
    densityGPerMl?: number | null;
    allergens?: string[];
    customConversions?: string | null;
    notes?: string | null;
    batchPricing?: any; // Include batchPricing if available
  } | null;
}

export function IngredientModal({ isOpen, onClose, onSuccess, companyId, editIngredient }: IngredientModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [allergens, setAllergens] = useState<string[]>(editIngredient?.allergens || []);
  const [otherAllergen, setOtherAllergen] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  
  useEffect(() => {
    if (editIngredient?.allergens) {
      setAllergens(editIngredient.allergens);
      const hasOther = editIngredient.allergens.some(a => !ALLERGEN_OPTIONS.includes(a) && a !== "Other");
      setShowOtherInput(hasOther || editIngredient.allergens.includes("Other"));
      if (hasOther) {
        const other = editIngredient.allergens.find(a => !ALLERGEN_OPTIONS.includes(a) && a !== "Other");
        setOtherAllergen(other || "");
      }
    } else {
      // Reset allergens state when not editing
      setAllergens([]);
      setShowOtherInput(false);
      setOtherAllergen("");
    }
  }, [editIngredient]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      // Prevent background scroll when modal open
      document.body.style.overflow = 'hidden';
    } else if (mounted) {
      document.body.style.overflow = '';
      // Reset form state when modal closes
      setAllergens([]);
      setShowOtherInput(false);
      setOtherAllergen("");
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted]);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (editIngredient) {
        await updateIngredient(editIngredient.id, formData);
      } else {
        await createIngredient(formData);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving ingredient:", error);
      alert(error?.message || "Failed to save ingredient. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Convert base quantity back to original unit quantity for display
  const convertedInitialData = useMemo(() => {
    if (!editIngredient) return undefined;
    
    const originalUnit = editIngredient.originalUnit || editIngredient.packUnit;
    let originalQuantity: number;
    
    // Debug logging
    console.log('IngredientModal conversion:', {
      packQuantity: editIngredient.packQuantity,
      packUnit: editIngredient.packUnit,
      originalUnit: editIngredient.originalUnit,
      targetUnit: originalUnit
    });
    
    if (editIngredient.originalUnit && editIngredient.packUnit) {
      // Convert from base unit back to original unit
      const converted = fromBase(
        Number(editIngredient.packQuantity), 
        editIngredient.packUnit as BaseUnit, 
        originalUnit as Unit
      );
      console.log('Converted value:', converted);
      // Ensure we have a valid positive number
      originalQuantity = isNaN(converted) || converted <= 0 ? Number(editIngredient.packQuantity) : converted;
    } else {
      originalQuantity = Number(editIngredient.packQuantity) || 1;
    }
    
    console.log('Final originalQuantity:', originalQuantity);
    
    return {
      name: editIngredient.name,
      supplierId: editIngredient.supplierId || undefined,
      packQuantity: originalQuantity,
      packUnit: originalUnit as Unit,
      packPrice: editIngredient.packPrice,
      densityGPerMl: editIngredient.densityGPerMl || undefined,
      allergens: editIngredient.allergens || [],
      customConversions: editIngredient.customConversions || undefined,
      notes: editIngredient.notes || "",
      batchPricing: editIngredient.batchPricing ? (typeof editIngredient.batchPricing === 'string' ? JSON.parse(editIngredient.batchPricing) : editIngredient.batchPricing) : undefined,
    };
  }, [editIngredient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {editIngredient && (
        <RecentItemsTracker
          id={editIngredient.id}
          type="ingredient"
          name={editIngredient.name}
        />
      )}
      {/* Backdrop - Light blur effect */}
      <div 
        className="fixed inset-0 bg-white/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-7xl max-h-[98vh] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900">
              {editIngredient ? "Edit Ingredient" : "New Ingredient"}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 p-4 overflow-y-auto">
              <IngredientForm
                key={editIngredient?.id || 'new'}
                companyId={companyId}
                suppliers={suppliers}
                onSubmit={handleSubmit}
                initialData={convertedInitialData}
                allergens={allergens}
                onAllergenChange={setAllergens}
                otherAllergen={otherAllergen}
                onOtherAllergenChange={setOtherAllergen}
                showOtherInput={showOtherInput}
                onShowOtherInputChange={setShowOtherInput}
              />
            </div>
            
            {/* Allergens Sidebar */}
            <AllergensSidebar
              allergens={allergens}
              onAllergenChange={setAllergens}
              otherAllergen={otherAllergen}
              onOtherAllergenChange={setOtherAllergen}
              showOtherInput={showOtherInput}
              onShowOtherInputChange={setShowOtherInput}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="ingredient-form"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : editIngredient ? "Update Ingredient" : "Create Ingredient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
