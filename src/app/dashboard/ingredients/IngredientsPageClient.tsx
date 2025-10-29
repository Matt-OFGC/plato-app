"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IngredientModal } from "@/components/IngredientModal";
import { IngredientsView } from "@/components/IngredientsView";
import { SmartImporter } from "@/components/SmartImporter";
import { SearchBar } from "@/components/SearchBar";
import { StalePriceAlerts } from "@/components/StalePriceAlerts";
import { Unit } from "@/lib/units";

// Use the same Ingredient type as IngredientsView
type Ingredient = Parameters<typeof IngredientsView>[0]['ingredients'][0];

interface IngredientsPageClientProps {
  ingredients: Ingredient[];
  deleteIngredient: (id: number) => Promise<void>;
  companyId: number;
}

export function IngredientsPageClient({ ingredients, deleteIngredient, companyId }: IngredientsPageClientProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Use props directly instead of local state to ensure UI updates after router.refresh()
  // This fixes the issue where deleted ingredients don't disappear until manual page refresh

  const handleNewIngredient = () => {
    setEditingIngredient(null);
    setIsModalOpen(true);
  };

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
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-responsive-h2 text-[var(--foreground)]">Ingredients</h1>
          <p className="text-responsive-body text-[var(--muted-foreground)] mt-2">Manage your ingredient inventory and pricing data with automatic unit conversion</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SmartImporter type="ingredients" />
          <button 
            onClick={handleNewIngredient}
            className="btn-responsive-primary flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ingredient
          </button>
        </div>
      </div>

      {/* Stale Price Alerts */}
      <div className="mb-8">
        <StalePriceAlerts ingredients={ingredients.map(ing => ({
          id: ing.id,
          name: ing.name,
          lastPriceUpdate: ing.lastPriceUpdate || new Date(),
          packPrice: ing.packPrice,
          supplier: ing.supplierRef?.name || ing.supplier || undefined,
        }))} />
      </div>

      <div className="mb-6">
        <SearchBar placeholder="Search ingredients by name, supplier, or notes..." />
      </div>

      <IngredientsView 
        ingredients={ingredients} 
        deleteIngredient={deleteIngredient}
        onEdit={handleEditIngredient}
        onNew={handleNewIngredient}
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