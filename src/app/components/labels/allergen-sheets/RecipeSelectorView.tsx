"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, AlertTriangle } from 'lucide-react';

interface Recipe {
  id: number;
  name: string;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
  image_url?: string;
  has_recent_changes?: boolean;
}

interface RecipeSelectorViewProps {
  selectedRecipes: Recipe[];
  onSelectionChange: (recipes: Recipe[]) => void;
  onNavigateToSheetStyle?: () => void;
}

export function RecipeSelectorView({ selectedRecipes, onSelectionChange, onNavigateToSheetStyle }: RecipeSelectorViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes?full=true');
      if (!response.ok) {
        throw new Error(`Failed to load recipes: ${response.status}`);
      }
      const data = await response.json();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRecipes(data);
      } else {
        console.error('Invalid response format:', data);
        setRecipes([]);
      }
    } catch (error) {
      console.error('Failed to load recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesChanges = !showOnlyChanges || r.has_recent_changes;
    return matchesSearch && matchesCategory && matchesChanges;
  });

  // Toggle recipe selection
  const handleToggle = (recipeId: number) => {
    const existing = selectedRecipes.find(r => r.id === recipeId);
    if (existing) {
      onSelectionChange(selectedRecipes.filter(r => r.id !== recipeId));
    } else {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        onSelectionChange([...selectedRecipes, recipe]);
      }
    }
  };

  // Select all visible recipes
  const selectAll = () => {
    onSelectionChange(filteredRecipes);
  };

  // Clear all selections
  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Select Recipes
        </h1>
        <p className="text-lg text-gray-500">
          Choose which recipes to include in your allergen information sheets
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <div className="flex gap-4 flex-wrap">

          {/* Search Input */}
          <div className="flex-1 min-w-[300px] relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="cakes">Cakes</option>
            <option value="brownies">Brownies</option>
            <option value="cookies">Cookies</option>
            <option value="bread">Bread</option>
            <option value="pastries">Pastries</option>
          </select>

          {/* Show Changes Toggle */}
          <label className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={showOnlyChanges}
              onChange={(e) => setShowOnlyChanges(e.target.checked)}
              className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Recent changes only</span>
          </label>

          {/* Select All Button */}
          <button
            onClick={selectAll}
            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition-all"
          >
            Select All
          </button>

          {/* Clear All Button */}
          {selectedRecipes.length > 0 && (
            <button
              onClick={clearAll}
              className="px-6 py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Recipe List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No recipes found matching your filters</p>
          </div>
        ) : (
          filteredRecipes.map(recipe => {
            const isSelected = selectedRecipes.find(r => r.id === recipe.id);

            return (
              <div
                key={recipe.id}
                className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white/70 backdrop-blur-xl'
                }`}
                onClick={() => handleToggle(recipe.id)}
              >
                <div className="flex items-center gap-4">

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={() => handleToggle(recipe.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 h-6 rounded text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />

                  {/* Recipe Image (if available) */}
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  )}

                  {/* Recipe Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {recipe.name}
                      </h3>

                      {/* Recent Changes Badge */}
                      {recipe.has_recent_changes && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          <AlertTriangle size={12} />
                          Changed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {/* Allergens Badge */}
                      {recipe.allergens && recipe.allergens.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          Contains: {recipe.allergens.slice(0, 3).join(', ')}
                          {recipe.allergens.length > 3 && ` +${recipe.allergens.length - 3}`}
                        </span>
                      )}

                      {/* Dietary Tags */}
                      {recipe.dietary_tags?.includes('vegan') && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Vegan
                        </span>
                      )}
                      {recipe.dietary_tags?.includes('gluten_free') && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                          GF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {selectedRecipes.length > 0 && (
        <div className="sticky bottom-0 bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
          <div className="grid grid-cols-3 gap-6">

            {/* Recipes Selected */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Recipes Selected</p>
              <p className="text-3xl font-bold text-gray-900">{selectedRecipes.length}</p>
            </div>

            {/* Total Allergens */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Unique Allergens</p>
              <p className="text-3xl font-bold text-gray-900">
                {new Set(selectedRecipes.flatMap(r => r.allergens || [])).size}
              </p>
            </div>

            {/* Next Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (onNavigateToSheetStyle) {
                    onNavigateToSheetStyle();
                  } else {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('view', 'sheet-style');
                    router.push(`?${params.toString()}`);
                  }
                }}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                Choose Style →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
