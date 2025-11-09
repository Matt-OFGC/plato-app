"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency";
import { Unit } from "@/lib/units";
import { formatLastUpdate, checkPriceStatus, getPriceStatusColorClass } from "@/lib/priceTracking";

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
  deleteIngredient: (id: number) => Promise<void>; // Server action
  onEdit?: (ingredient: Ingredient) => void; // Callback for editing
  onNew?: () => void; // Callback for creating new ingredient
  selectedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onSelectAll?: () => void;
  isSelecting?: boolean;
}

export function IngredientsView({ ingredients, deleteIngredient, onEdit, onNew, selectedIds = new Set(), onSelect, onSelectAll, isSelecting = false }: IngredientsViewProps) {
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
      </div>

      {/* List view only */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSelecting && (
                    <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === ingredients.length && ingredients.length > 0}
                        onChange={onSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="hidden lg:table-cell px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="hidden xl:table-cell px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allergens</th>
                  <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                  <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-2 md:px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ing) => {
                  // Use originalUnit if available, otherwise use packUnit
                  const displayUnit = ing.originalUnit || ing.packUnit || 'each';
                  const displayQuantity = Number(ing.packQuantity);
                  const priceStatus = checkPriceStatus(ing.lastPriceUpdate || new Date());
                  const colorClass = getPriceStatusColorClass(priceStatus.status);
                  
                  return (
                    <tr key={ing.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(ing.id) ? 'bg-emerald-50' : ''}`}>
                      {isSelecting && (
                        <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(ing.id)}
                            onChange={() => onSelect?.(ing.id)}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      )}
                      <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => onEdit?.(ing)}
                          className="text-sm font-medium text-gray-900 hover:text-emerald-600 text-left"
                        >
                          {ing.name}
                        </button>
                      </td>
                      <td className="hidden lg:table-cell px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ing.supplierRef?.name || ing.supplier || '-'}
                      </td>
                      <td className="hidden xl:table-cell px-2 md:px-4 lg:px-6 py-4 text-sm">
                        {ing.allergens && ing.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ing.allergens.slice(0, 3).map((allergen, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {allergen}
                              </span>
                            ))}
                            {ing.allergens.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                +{ing.allergens.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {displayQuantity} {displayUnit}
                      </td>
                      <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatCurrency(Number(ing.packPrice), ing.currency)}
                      </td>
                      <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${colorClass.replace('border', 'border-0')}`}>
                          {formatLastUpdate(ing.lastPriceUpdate || new Date())}
                        </span>
                      </td>
                      <td className="px-2 md:px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onEdit?.(ing)}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                        >
                          Edit
                        </button>
                        <button 
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            if (!confirm("Delete this ingredient? This cannot be undone.")) return;
                            startTransition(async () => {
                              try {
                                await deleteIngredient(ing.id);
                                router.refresh();
                              } catch (error: any) {
                                alert(error.message || "Failed to delete ingredient");
                              }
                            });
                          }}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {isPending ? 'Deleting…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}

