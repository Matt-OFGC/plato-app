"use client";

import { useState } from "react";
import Link from "next/link";
import { ViewToggle } from "./ViewToggle";
import { formatCurrency } from "@/lib/currency";
import { fromBase, Unit } from "@/lib/units";
import { formatLastUpdate, checkPriceStatus, getPriceStatusColorClass } from "@/lib/priceTracking";

type ViewMode = 'grid' | 'list';

interface Ingredient {
  id: number;
  name: string;
  supplier: string | null;
  supplierRef: { name: string; contactName: string | null } | null;
  packQuantity: any;
  packUnit: string;
  originalUnit: string | null;
  packPrice: any;
  currency: string;
  densityGPerMl: any;
  lastPriceUpdate: Date | null;
}

interface IngredientsViewProps {
  ingredients: Ingredient[];
  deleteIngredient: any; // Server action
}

export function IngredientsView({ ingredients, deleteIngredient }: IngredientsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        <Link href="/dashboard/ingredients/new" className="btn-primary">
          Add First Ingredient
        </Link>
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
          onChange={setViewMode}
          storageKey="ingredients-view-mode"
        />
      </div>

      {viewMode === 'grid' ? (
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
                  <Link href={`/dashboard/ingredients/${ing.id}`} className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                    {ing.name}
                  </Link>
                  {(ing.supplierRef || ing.supplier) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Supplier: {ing.supplierRef?.name || ing.supplier}
                      {ing.supplierRef?.contactName && (
                        <span className="text-gray-500"> ({ing.supplierRef.contactName})</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Pack Size:</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const originalUnit = ing.originalUnit || ing.packUnit;
                        const originalQuantity = ing.originalUnit 
                          ? fromBase(Number(ing.packQuantity), originalUnit as Unit, ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined)
                          : Number(ing.packQuantity);
                        return `${originalQuantity} ${originalUnit}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(Number(ing.packPrice), ing.currency)}
                    </span>
                  </div>
                  {ing.densityGPerMl && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Density:</span>
                      <span className="font-medium text-gray-900">
                        {String(ing.densityGPerMl)} g/ml
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Price Update */}
                {(() => {
                  const priceStatus = checkPriceStatus(ing.lastPriceUpdate || new Date());
                  const colorClass = getPriceStatusColorClass(priceStatus.status);
                  return (
                    <div className={`text-xs px-3 py-2 rounded-lg border ${colorClass} flex items-center gap-2`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Updated: {formatLastUpdate(ing.lastPriceUpdate || new Date())}</span>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Link 
                    href={`/dashboard/ingredients/${ing.id}`}
                    className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium text-center"
                  >
                    Edit
                  </Link>
                  <form action={deleteIngredient.bind(null, ing.id)} className="inline">
                    <button 
                      type="submit" 
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ing) => {
                  const originalUnit = ing.originalUnit || ing.packUnit;
                  const originalQuantity = ing.originalUnit 
                    ? fromBase(Number(ing.packQuantity), originalUnit as Unit, ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined)
                    : Number(ing.packQuantity);
                  const priceStatus = checkPriceStatus(ing.lastPriceUpdate || new Date());
                  const colorClass = getPriceStatusColorClass(priceStatus.status);
                  
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/ingredients/${ing.id}`} className="text-sm font-medium text-gray-900 hover:text-emerald-600">
                          {ing.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ing.supplierRef?.name || ing.supplier || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {originalQuantity} {originalUnit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {formatCurrency(Number(ing.packPrice), ing.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-1 rounded-full ${colorClass.replace('border', 'border-0')}`}>
                          {formatLastUpdate(ing.lastPriceUpdate || new Date())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/dashboard/ingredients/${ing.id}`}
                          className="text-emerald-600 hover:text-emerald-900 mr-4"
                        >
                          Edit
                        </Link>
                        <form action={deleteIngredient.bind(null, ing.id)} className="inline">
                          <button 
                            type="submit" 
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

