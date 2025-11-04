"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FloatingFilterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingFilter({ isOpen, onClose }: FloatingFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    supplier: searchParams.get('supplier') || '',
    allergens: searchParams.get('allergens') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    storage: searchParams.get('storage') || '',
  });

  const isRecipesPage = pathname.startsWith('/dashboard/recipes') && !pathname.match(/\/dashboard\/recipes\/[^/]+$/);
  const isIngredientsPage = pathname.startsWith('/dashboard/ingredients');

  // Get available filter options based on page
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [availableStorage, setAvailableStorage] = useState<string[]>([]);

  useEffect(() => {
    // Load filter options based on page type
    const loadFilterOptions = async () => {
      if (isRecipesPage) {
        // Load categories for recipes - try to get from current page data
        // For now, we'll extract from URL or use empty array
        // Categories will be populated from the recipes page props if needed
        setAvailableCategories([]);
      } else if (isIngredientsPage) {
        // Load suppliers for ingredients
        try {
          const suppliersResponse = await fetch('/api/suppliers');
          if (suppliersResponse.ok) {
            const suppliersData = await suppliersResponse.json();
            setAvailableSuppliers((suppliersData.suppliers || []).map((s: any) => s.name));
          }
        } catch (error) {
          console.error('Failed to load suppliers:', error);
        }
        // Storage options can be extracted from ingredients if needed
        setAvailableStorage([]);
      }
    };

    if (isOpen) {
      loadFilterOptions();
    }
  }, [isOpen, isRecipesPage, isIngredientsPage]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
    onClose();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      supplier: '',
      allergens: '',
      minPrice: '',
      maxPrice: '',
      storage: '',
    });
    router.push(pathname);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed top-24 right-6 z-50 bg-white rounded-xl border border-neutral-200 shadow-xl w-80 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filter Options */}
          <div className="space-y-4">
            {/* Category Filter (Recipes) */}
            {isRecipesPage && availableCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Filter (Ingredients) */}
            {isIngredientsPage && availableSuppliers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">All Suppliers</option>
                  {availableSuppliers.map((supplier) => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Storage Filter (Ingredients) */}
            {isIngredientsPage && availableStorage.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                <select
                  value={filters.storage}
                  onChange={(e) => setFilters({ ...filters, storage: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="">All Storage Types</option>
                  {availableStorage.map((storage) => (
                    <option key={storage} value={storage}>{storage}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Allergens Filter */}
            {(isRecipesPage || isIngredientsPage) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
                <input
                  type="text"
                  value={filters.allergens}
                  onChange={(e) => setFilters({ ...filters, allergens: e.target.value })}
                  placeholder="Filter by allergens..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              </div>
            )}

            {/* Price Range Filter */}
            {(isRecipesPage || isIngredientsPage) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-200">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

