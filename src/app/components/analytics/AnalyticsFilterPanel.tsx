"use client";

import { useState } from "react";

interface AnalyticsFilterPanelProps {
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

export function AnalyticsFilterPanel({ 
  categories, 
  recipes, 
  filters, 
  onFiltersChange 
}: AnalyticsFilterPanelProps) {
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
    <div className="bg-white border border-[var(--border)] rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, start: new Date(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            <input
              type="date"
              value={filters.dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, end: new Date(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Period
          </label>
          <select
            value={filters.period}
            onChange={(e) => onFiltersChange({ ...filters, period: e.target.value as any })}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Categories
            </label>
            <button
              onClick={() => setShowCategories(!showCategories)}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80"
            >
              {showCategories ? "Hide" : "Show"} ({categories.length})
            </button>
          </div>
          
          {showCategories && (
            <div className="space-y-2 max-h-32 overflow-y-auto border border-[var(--border)] rounded-md p-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                  />
                  <span className="ml-2 text-[var(--foreground)]">
                    {category.name} ({category._count.recipes})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Recipes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Recipes
            </label>
            <button
              onClick={() => setShowRecipes(!showRecipes)}
              className="text-xs text-[var(--primary)] hover:text-[var(--primary)]/80"
            >
              {showRecipes ? "Hide" : "Show"} ({recipes.length})
            </button>
          </div>
          
          {showRecipes && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              
              <div className="space-y-2 max-h-32 overflow-y-auto border border-[var(--border)] rounded-md p-2">
                {filteredRecipes.map((recipe) => (
                  <label key={recipe.id} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.recipes.includes(recipe.id)}
                      onChange={() => handleRecipeToggle(recipe.id)}
                      className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                    />
                    <span className="ml-2 text-[var(--foreground)]">
                      {recipe.name}
                      {recipe.categoryRef && (
                        <span className="text-[var(--muted-foreground)] ml-1">({recipe.categoryRef.name})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <button
          onClick={resetFilters}
          className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
