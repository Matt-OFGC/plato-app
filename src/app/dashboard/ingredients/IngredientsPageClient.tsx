"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IngredientModal } from "@/components/IngredientModal";
import { IngredientsViewWithBulkActions } from "@/components/IngredientsViewWithBulkActions";
import { StalePriceAlerts } from "@/components/StalePriceAlerts";
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
    setEditingIngredient(null);
  };

  const handleModalSuccess = () => {
    // Refresh the page to get updated ingredients using Next.js router
    router.refresh();
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">Ingredients</h1>
        <p className="text-gray-500 text-lg mb-6">Manage your ingredient inventory and pricing data with automatic unit conversion</p>
      </div>

      {/* Stale Price Alerts */}
      <div className="mb-6">
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

      {/* Modal */}
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
    </div>
  );
}