"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

interface Ingredient {
  id: number;
  name: string;
  supplier?: string | null;
  supplierRef?: {
    id: number;
    name: string;
    minimumOrder?: number | null;
  } | null;
  packQuantity: number;
  packUnit: string;
  originalUnit?: string | null;
  packPrice: number;
  currency: string;
  densityGPerMl?: number | null;
  allergens: string[];
  notes?: string | null;
  lastPriceUpdate: Date;
}

interface IngredientsViewProps {
  ingredients: Ingredient[];
  deleteIngredient: (id: number) => Promise<void>;
}

export function IngredientsView({ ingredients, deleteIngredient }: IngredientsViewProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return;
    
    setDeletingId(id);
    try {
      await deleteIngredient(id);
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Failed to delete ingredient. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (ingredients.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No ingredients</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new ingredient.</p>
        <div className="mt-6">
          <Link
            href="/dashboard/ingredients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ingredient
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {ingredients.map((ingredient) => (
          <li key={ingredient.id}>
            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {ingredient.name}
                      </h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span className="mr-4">
                          {ingredient.packQuantity} {ingredient.originalUnit || ingredient.packUnit}
                        </span>
                        <span className="mr-4">
                          {formatCurrency(ingredient.packPrice, ingredient.currency)}
                        </span>
                        {ingredient.supplierRef?.name && (
                          <span className="mr-4">
                            Supplier: {ingredient.supplierRef.name}
                          </span>
                        )}
                      </div>
                      {ingredient.allergens && ingredient.allergens.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {ingredient.allergens.map((allergen, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {allergen}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {ingredient.notes && (
                        <p className="mt-1 text-sm text-gray-600 truncate">
                          {ingredient.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/ingredients/${ingredient.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(ingredient.id)}
                        disabled={deletingId === ingredient.id}
                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                      >
                        {deletingId === ingredient.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
