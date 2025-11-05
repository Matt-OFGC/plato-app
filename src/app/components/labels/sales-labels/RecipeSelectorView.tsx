"use client";

import React, { useState, useEffect } from 'react';
import { Search, Package } from 'lucide-react';

interface Recipe {
  id: number;
  name: string;
  selling_price?: number;
  allergens?: string[];
  dietary_tags?: string[];
  category?: string;
  image_url?: string;
  shelf_life?: number;
  quantity?: number;
}

interface RecipeSelectorViewProps {
  selectedRecipes: Recipe[];
  onSelectionChange: (recipes: Recipe[]) => void;
}

export function RecipeSelectorView({ selectedRecipes, onSelectionChange }: RecipeSelectorViewProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes');
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter recipes based on search and category
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle recipe selection
  const handleToggle = (recipeId: number) => {
    const existing = selectedRecipes.find(r => r.id === recipeId);
    if (existing) {
      // Remove from selection
      onSelectionChange(selectedRecipes.filter(r => r.id !== recipeId));
    } else {
      // Add to selection with default quantity of 21
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        onSelectionChange([...selectedRecipes, { ...recipe, quantity: 21 }]);
      }
    }
  };

  // Update quantity for a selected recipe
  const handleQuantityChange = (recipeId: number, quantity: number) => {
    onSelectionChange(selectedRecipes.map(r =>
      r.id === recipeId ? { ...r, quantity } : r
    ));
  };

  // Select all visible recipes
  const selectAll = () => {
    const newSelections = filteredRecipes.map(r => ({
      ...r,
      quantity: selectedRecipes.find(s => s.id === r.id)?.quantity || 21
    }));
    onSelectionChange(newSelections);
  };

  // Clear all selections
  const clearAll = () => {
    onSelectionChange([]);
  };

  // Calculate totals
  const totalLabels = selectedRecipes.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const sheetsNeeded = Math.ceil(totalLabels / 21); // 21 labels per sheet (65x38mm on A4)

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Select Products for Labels
        </h1>
        <p className="text-lg text-gray-500">
          Choose which products need labels and set quantities for each
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <div className="flex gap-4">

          {/* Search Input */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
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
            Loading products...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>No products found matching your search</p>
          </div>
        ) : (
          filteredRecipes.map(recipe => {
            const isSelected = selectedRecipes.find(r => r.id === recipe.id);
            const quantity = isSelected?.quantity || 21;

            return (
              <div
                key={recipe.id}
                className={`rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white/70 backdrop-blur-xl'
                }`}
                onClick={() => !isSelected && handleToggle(recipe.id)}
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
                    <h3 className="font-semibold text-lg text-gray-900">
                      {recipe.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {/* Price */}
                      {recipe.selling_price && (
                        <span className="text-sm text-gray-600">
                          £{recipe.selling_price.toFixed(2)}
                        </span>
                      )}

                      {/* Allergens Badge */}
                      {recipe.allergens && recipe.allergens.length > 0 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          Contains: {recipe.allergens.slice(0, 3).join(', ')}
                          {recipe.allergens.length > 3 && ` +${recipe.allergens.length - 3} more`}
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

                  {/* Quantity Selector (only if selected) */}
                  {isSelected && (
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <label className="text-sm font-medium text-gray-700">
                        Quantity:
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => handleQuantityChange(recipe.id, parseInt(e.target.value))}
                        className="px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="10">10 (Half Sheet)</option>
                        <option value="21">21 (Full Sheet)</option>
                        <option value="42">42 (2 Sheets)</option>
                        <option value="63">63 (3 Sheets)</option>
                        <option value="84">84 (4 Sheets)</option>
                        <option value="105">105 (5 Sheets)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Footer (sticky at bottom when items selected) */}
      {selectedRecipes.length > 0 && (
        <div className="sticky bottom-0 bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
          <div className="grid grid-cols-4 gap-6">

            {/* Products Selected */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Products Selected</p>
              <p className="text-3xl font-bold text-gray-900">{selectedRecipes.length}</p>
            </div>

            {/* Total Labels */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Labels</p>
              <p className="text-3xl font-bold text-gray-900">{totalLabels}</p>
            </div>

            {/* Sheets Needed */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Sheets Needed</p>
              <p className="text-3xl font-bold text-gray-900">{sheetsNeeded}</p>
              <p className="text-xs text-gray-500 mt-1">A4 sheets (65mm × 38mm)</p>
            </div>

            {/* Next Button */}
            <div className="flex items-end">
              <button
                onClick={() => window.location.hash = '#preview'}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                Preview Sheets →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
