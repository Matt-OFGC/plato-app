"use client";

import { useState, useEffect } from "react";
import { IngredientForm } from "./IngredientForm";
import { createIngredient, updateIngredient, getSuppliers } from "@/app/dashboard/ingredients/actions";
import { fromBase, Unit } from "@/lib/units";
import { RecentItemsTracker } from "./RecentItemsTracker";

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
  } | null;
}

export function IngredientModal({ isOpen, onClose, onSuccess, companyId, editIngredient }: IngredientModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
      // Prevent background scroll when modal open
      document.body.style.overflow = 'hidden';
    } else if (mounted) {
      document.body.style.overflow = '';
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
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
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
          <div className="p-6">
            <IngredientForm
              companyId={companyId}
              suppliers={suppliers}
              onSubmit={handleSubmit}
              initialData={editIngredient ? {
                name: editIngredient.name,
                supplierId: editIngredient.supplierId || undefined,
                packQuantity: editIngredient.packQuantity,
                packUnit: editIngredient.originalUnit || (editIngredient.packUnit as Unit),
                packPrice: editIngredient.packPrice,
                densityGPerMl: editIngredient.densityGPerMl || undefined,
                allergens: editIngredient.allergens || [],
                customConversions: editIngredient.customConversions || undefined,
                notes: editIngredient.notes || "",
              } : undefined}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
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
