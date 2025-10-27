"use client";

import { useState, useEffect } from "react";
import { DateRangePicker } from "./DateRangePicker";
import { SavedPresets } from "./SavedPresets";

interface FilterPanelProps {
  categories: Array<{
    id: number;
    name: string;
    _count: { recipes: number };
  }>;
  recipes: Array<{
    id: number;
    name: string;
    categoryRef: { name: string } | null;
  }>;
  filters: {
    dateRange: { start: Date; end: Date };
    categories: number[];
    recipes: number[];
    period: "daily" | "weekly" | "monthly";
  };
  onFiltersChange: (filters: any) => void;
}

export function FilterPanel({ 
  categories, 
  recipes, 
  filters, 
  onFiltersChange 
}: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);

  // Filter recipes based on search term
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleRecipeToggle = (recipeId: number) => {
    const newRecipes = filters.recipes.includes(recipeId)
      ? filters.recipes.filter(id => id !== recipeId)
      : [...filters.recipes, recipeId];
    
    onFiltersChange({
      ...filters,
      recipes: newRecipes
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      categories: [],
      recipes: [],
      period: "monthly"
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">Filters</h2>
          <p className="text-sm text-slate-400">Customize your analytics view</p>
        </div>

        {/* Saved Presets */}
        <SavedPresets onApplyPreset={onFiltersChange} />

        {/* Date Range */}
        <div>
          <h3 className="text-sm font-medium text-slate-200 mb-3">Date Range</h3>
          <DateRangePicker
            value={filters.dateRange}
            onChange={(dateRange) => onFiltersChange({ ...filters, dateRange })}
          />
        </div>

        {/* Period Selection */}
        <div>
          <h3 className="text-sm font-medium text-slate-200 mb-3">Period</h3>
          <div className="space-y-2">
            {["daily", "weekly", "monthly"].map((period) => (
              <label key={period} className="flex items-center">
                <input
                  type="radio"
                  name="period"
                  value={period}
                  checked={filters.period === period}
                  onChange={(e) => onFiltersChange({ ...filters, period: e.target.value as any })}
                  className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 focus:ring-cyan-500 focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300 capitalize">{period}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-200">Categories</h3>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {showCategories ? "Hide" : "Show"} ({categories.length})
            </button>
          </div>
          
          {showCategories && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-slate-300">
                    {category.name} ({category._count.recipes})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Recipes Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-200">Recipes</h3>
            <button
              onClick={() => setShowRecipes(!showRecipes)}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              {showRecipes ? "Hide" : "Show"} ({recipes.length})
            </button>
          </div>
          
          {showRecipes && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredRecipes.map((recipe) => (
                  <label key={recipe.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.recipes.includes(recipe.id)}
                      onChange={() => handleRecipeToggle(recipe.id)}
                      className="w-4 h-4 text-cyan-500 bg-slate-800 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-slate-300">
                      {recipe.name}
                      {recipe.categoryRef && (
                        <span className="text-slate-500 ml-1">({recipe.categoryRef.name})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>

        {/* Active Filters Summary */}
        {(filters.categories.length > 0 || filters.recipes.length > 0) && (
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-slate-200 mb-2">Active Filters</h4>
            <div className="space-y-1 text-xs text-slate-400">
              {filters.categories.length > 0 && (
                <div>Categories: {filters.categories.length}</div>
              )}
              {filters.recipes.length > 0 && (
                <div>Recipes: {filters.recipes.length}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
