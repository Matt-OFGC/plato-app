'use client';

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ViewToggle } from "./ViewToggle";
import { formatCurrency } from "@/lib/currency";
import { fromBase, Unit } from "@/lib/units";
import { formatLastUpdate, checkPriceStatus, getPriceStatusColorClass } from "@/lib/priceTracking";
import { VirtualizedIngredientList } from "./VirtualizedList";

type ViewMode = 'grid' | 'list' | 'virtual';

interface Ingredient {
  id: number;
  name: string;
  supplier: string | null;
  supplierRef: { name: string; contactName: string | null; minimumOrder: number | null } | null;
  packQuantity: number;
  packUnit: string;
  originalUnit: string | null;
  packPrice: number;
  currency: string;
  densityGPerMl: number | null;
  lastPriceUpdate: Date | null;
}

interface IngredientsViewProps {
  ingredients: Ingredient[];
  deleteIngredient: (id: number) => Promise<void>;
  onEdit?: (ingredient: Ingredient) => void;
  onNew?: () => void;
}

export function IngredientsView({ ingredients, deleteIngredient, onEdit, onNew }: IngredientsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (ingredients.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No ingredients yet</h3>
        <p className="text-[var(--muted-foreground)] mb-6">Get started by adding your first ingredient</p>
        <button 
          onClick={() => onNew?.()}
          className="btn-primary"
        >
          Add First Ingredient
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
        </p>
        <ViewToggle 
          defaultView="grid" 
          onChange={(mode) => setViewMode(mode as ViewMode)}
          storageKey="ingredients-view-mode"
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
            { value: 'virtual', label: 'Fast List' }
          ]}
        />
      </div>

      {/* Virtual List View - Best for large lists */}
      {viewMode === 'virtual' && (
        <VirtualizedIngredientList 
          ingredients={ingredients.map(ingredient => ({
            id: ingredient.id,
            name: ingredient.name,
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit,
            packPrice: ingredient.packPrice,
            supplier: ingredient.supplierRef?.name || ingredient.supplier || undefined,
          }))}
          height={600}
          onIngredientClick={(ingredient) => {
            onEdit?.(ingredient);
          }}
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ingredients.map((ing) => (
            <div key={ing.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 active:scale-95">
              {/* Ingredient Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              {/* Ingredient Info */}
              <div className="space-y-3">
                <div>
                  <button 
                    onClick={() => onEdit?.(ing)}
                    className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-left"
                  >
                    {ing.name}
                  </button>
                  {(ing.supplierRef || ing.supplier) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier: {ing.supplierRef?.name || ing.supplier}
                      {ing.supplierRef?.contactName && (
                        <span className="text-gray-500"> ({ing.supplierRef.contactName})</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Pack Info */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pack Size:</span>
                    <span className="font-medium">
                      {ing.packQuantity} {ing.packUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(ing.packPrice, ing.currency)}
                    </span>
                  </div>
                  {ing.originalUnit && ing.originalUnit !== ing.packUnit && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Original:</span>
                      <span className="text-sm text-gray-500">
                        {ing.originalUnit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Status */}
                {ing.lastPriceUpdate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Last updated: {formatLastUpdate(ing.lastPriceUpdate)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriceStatusColorClass(checkPriceStatus(ing.lastPriceUpdate))}`}>
                      {checkPriceStatus(ing.lastPriceUpdate)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => onEdit?.(ing)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${ing.name}"?`)) {
                        startTransition(() => {
                          deleteIngredient(ing.id);
                        });
                      }
                    }}
                    disabled={isPending}
                    className="flex-1 btn-outline text-sm py-2 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    {isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {ingredients.map((ing) => (
            <div key={ing.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              {/* Ingredient Icon */}
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              
              {/* Ingredient Info */}
              <div className="flex-1 min-w-0">
                <button 
                  onClick={() => onEdit?.(ing)}
                  className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-left"
                >
                  {ing.name}
                </button>
                {(ing.supplierRef || ing.supplier) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Supplier: {ing.supplierRef?.name || ing.supplier}
                    {ing.supplierRef?.contactName && (
                      <span className="text-gray-500"> ({ing.supplierRef.contactName})</span>
                    )}
                  </p>
                )}
                {ing.lastPriceUpdate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatLastUpdate(ing.lastPriceUpdate)}
                  </p>
                )}
              </div>
              
              {/* Pack Info */}
              <div className="text-right text-sm">
                <div className="font-medium text-gray-900">
                  {ing.packQuantity} {ing.packUnit}
                </div>
                <div className="text-emerald-600 font-medium">
                  {formatCurrency(ing.packPrice, ing.currency)}
                </div>
                {ing.lastPriceUpdate && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriceStatusColorClass(checkPriceStatus(ing.lastPriceUpdate))}`}>
                    {checkPriceStatus(ing.lastPriceUpdate)}
                  </span>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => onEdit?.(ing)}
                  className="btn-secondary text-sm px-3 py-1"
                >
                  Edit
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${ing.name}"?`)) {
                      startTransition(() => {
                        deleteIngredient(ing.id);
                      });
                    }
                  }}
                  disabled={isPending}
                  className="btn-outline text-sm px-3 py-1 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
