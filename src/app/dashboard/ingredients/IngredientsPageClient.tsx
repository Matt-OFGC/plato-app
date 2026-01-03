"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IngredientModal } from "@/components/IngredientModal";
import { IngredientsViewWithBulkActions } from "@/components/IngredientsViewWithBulkActions";
import { StalePriceAlerts } from "@/components/StalePriceAlerts";
import { BulkImportModal } from "@/components/ingredients/BulkImportModal";
import { Unit } from "@/lib/units";
import { usePageActions } from "@/components/PageActionContext";

// Use the same Ingredient type as IngredientsView
type Ingredient = Parameters<typeof IngredientsViewWithBulkActions>[0]['ingredients'][0];

interface Supplier {
  id: number;
  name: string;
}

interface IngredientsPageClientProps {
  ingredients: Ingredient[];
  deleteIngredient: (id: number) => Promise<void>;
  companyId: number;
  suppliers: Supplier[];
}

export function IngredientsPageClient({ ingredients, deleteIngredient, companyId, suppliers }: IngredientsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerNewAction, unregisterNewAction } = usePageActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Get search term from URL
  const searchTerm = searchParams.get("search") || "";
  
  // Use local state for instant filtering while URL updates are debounced
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Sync local search term with URL when it changes (from debounced updates)
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Pre-compute lowercase values for faster filtering (only recompute when ingredients change)
  const ingredientsWithLowercase = useMemo(() => {
    return ingredients.map(ing => ({
      ...ing,
      _searchName: (ing.name || '').toLowerCase(),
      _searchSupplier: ing.supplier?.toLowerCase() || '',
      _searchSupplierRef: ing.supplierRef?.name?.toLowerCase() || '',
      _searchNotes: ing.notes?.toLowerCase() || '',
    }));
  }, [ingredients]);
  
  // Optimized filter function - uses pre-computed lowercase values and local search term for instant feedback
  const ingredientsList = useMemo(() => {
    const termToUse = localSearchTerm.trim();
    if (!termToUse) {
      return ingredients;
    }
    
    const searchLower = termToUse.toLowerCase();
    // Early exit if search is too short
    if (searchLower.length < 1) {
      return ingredients;
    }
    
    // Use pre-computed lowercase values for faster filtering
    return ingredientsWithLowercase.filter(ing => 
      ing._searchName.includes(searchLower) ||
      ing._searchSupplier.includes(searchLower) ||
      ing._searchSupplierRef.includes(searchLower) ||
      ing._searchNotes.includes(searchLower)
    ).map(({ _searchName, _searchSupplier, _searchSupplierRef, _searchNotes, ...ing }) => ing);
  }, [ingredients, ingredientsWithLowercase, localSearchTerm]);
  
  // Listen for search input changes from FloatingNavigation (using custom event)
  useEffect(() => {
    const handleSearchChange = (e: CustomEvent<string>) => {
      setLocalSearchTerm(e.detail);
    };
    
    window.addEventListener('ingredient-search-change' as any, handleSearchChange);
    return () => {
      window.removeEventListener('ingredient-search-change' as any, handleSearchChange);
    };
  }, []);

  const handleNewIngredient = () => {
    setEditingIngredient(null);
    setIsModalOpen(true);
  };

  // Register the new ingredient action when component mounts
  useEffect(() => {
    registerNewAction(handleNewIngredient);
    return () => {
      unregisterNewAction();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Clear editing ingredient to ensure fresh data on next edit
    setEditingIngredient(null);
  };

  const handleModalSuccess = () => {
    // Clear editing ingredient state before refresh
    setEditingIngredient(null);
    setIsModalOpen(false);
    // Refresh the page to get updated ingredients using Next.js router
    router.refresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6">
      {/* Page Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-1">Ingredients</h1>
          <p className="text-gray-500 text-base mb-4">Manage your ingredient inventory and pricing data with automatic unit conversion</p>
        </div>
        <button
          onClick={() => setIsBulkImportOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Import CSV
        </button>
      </div>

      {/* Stale Price Alerts */}
      <div className="mb-4">
        <StalePriceAlerts ingredients={ingredientsList.map(ing => ({
          id: ing.id,
          name: ing.name,
          lastPriceUpdate: ing.lastPriceUpdate || new Date(),
          packPrice: ing.packPrice,
          supplier: ing.supplierRef?.name || ing.supplier || undefined,
        }))} />
      </div>

      <IngredientsViewWithBulkActions 
        ingredients={ingredientsList} 
        deleteIngredient={deleteIngredient}
        onEdit={handleEditIngredient}
        onNew={handleNewIngredient}
        suppliers={suppliers}
      />

      {/* Modals */}
      <IngredientModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        companyId={companyId}
        editIngredient={editingIngredient ? {
          ...editingIngredient,
          originalUnit: editingIngredient.originalUnit as Unit | null
        } : null}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => {
          setIsBulkImportOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}