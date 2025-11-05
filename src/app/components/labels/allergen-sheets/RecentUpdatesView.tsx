"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, ChevronRight, RefreshCw } from 'lucide-react';

interface Recipe {
  id: number;
  name: string;
  category: string | null;
  allergens: string[];
  dietary_tags: string[];
  has_recent_changes: boolean;
}

interface Update {
  id: number;
  updateType: string;
  changedField: string | null;
  oldValue: string | null;
  newValue: string | null;
  allergenImpact: boolean;
  updatedAt: Date;
}

interface RecipeUpdate {
  recipe: Recipe;
  updates: Update[];
  latestUpdate: Date;
  changeCount: number;
}

interface RecentUpdatesViewProps {
  onSelectRecipes?: (recipes: Recipe[]) => void;
}

export function RecentUpdatesView({ onSelectRecipes }: RecentUpdatesViewProps) {
  const [updates, setUpdates] = useState<RecipeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<number>>(new Set());
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    fetchUpdates();
  }, [daysFilter]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/updates?allergen_impact=true&days=${daysFilter}`);
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const updatesWithDates = data.data.map((item: any) => ({
          ...item,
          latestUpdate: new Date(item.latestUpdate),
          updates: item.updates.map((update: any) => ({
            ...update,
            updatedAt: new Date(update.updatedAt)
          }))
        }));
        setUpdates(updatesWithDates);
      } else {
        console.error('Failed to fetch updates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recipe updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipeSelection = (recipeId: number) => {
    const newSelection = new Set(selectedRecipeIds);
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId);
    } else {
      newSelection.add(recipeId);
    }
    setSelectedRecipeIds(newSelection);
  };

  const toggleExpanded = (recipeId: number) => {
    setExpandedRecipeId(expandedRecipeId === recipeId ? null : recipeId);
  };

  const selectAllRecipes = () => {
    setSelectedRecipeIds(new Set(updates.map(u => u.recipe.id)));
  };

  const deselectAllRecipes = () => {
    setSelectedRecipeIds(new Set());
  };

  const handleGenerateSheets = () => {
    const selectedRecipes = updates
      .filter(u => selectedRecipeIds.has(u.recipe.id))
      .map(u => u.recipe);

    if (onSelectRecipes) {
      onSelectRecipes(selectedRecipes);
    }
  };

  const getTimeSince = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getChangeTypeLabel = (updateType: string): string => {
    const labels: Record<string, string> = {
      'ingredient_change': 'Ingredient Modified',
      'allergen_change': 'Allergen Updated',
      'ingredient_supplier_change': 'Supplier Changed',
      'recipe_modified': 'Recipe Modified',
      'nutrition_change': 'Nutrition Updated'
    };
    return labels[updateType] || updateType;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
          Recent Recipe Updates
        </h1>
        <p className="text-lg text-gray-500">
          Track ingredient changes that affect allergen information
        </p>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <div className="flex items-center justify-between">
          {/* Time Filter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Show updates from:</span>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <button
              onClick={fetchUpdates}
              className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Selection Actions */}
          {selectedRecipeIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {selectedRecipeIds.size} selected
              </span>
              <button
                onClick={deselectAllRecipes}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Deselect All
              </button>
              <button
                onClick={handleGenerateSheets}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
              >
                Generate Allergen Sheets
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Bulk Selection */}
        {updates.length > 0 && selectedRecipeIds.size === 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={selectAllRecipes}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Select all {updates.length} recipe{updates.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {/* Updates List */}
      {loading ? (
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading updates...</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Recent Changes Detected
          </h3>
          <p className="text-gray-600">
            No allergen-impacting recipe changes in the last {daysFilter} days
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(({ recipe, updates: recipeUpdates, latestUpdate, changeCount }) => {
            const isSelected = selectedRecipeIds.has(recipe.id);
            const isExpanded = expandedRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                className={`bg-white/70 backdrop-blur-2xl rounded-3xl border-2 shadow-lg transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-gray-200/60 hover:border-gray-300'
                }`}
              >
                {/* Recipe Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipeSelection(recipe.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Warning Icon */}
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={24} className="text-red-600" />
                    </div>

                    {/* Recipe Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{recipe.name}</h3>
                          {recipe.category && (
                            <span className="text-sm text-gray-600">{recipe.category}</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{getTimeSince(latestUpdate)}</span>
                      </div>

                      {/* Change Summary */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          <strong>{changeCount}</strong> allergen-impacting change{changeCount !== 1 ? 's' : ''} detected
                        </p>
                      </div>

                      {/* Allergens */}
                      {recipe.allergens && recipe.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {recipe.allergens.map((allergen, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleExpanded(recipe.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {isExpanded ? 'Hide details' : 'View details'} →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50/50 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                      Change History
                    </h4>
                    <div className="space-y-3">
                      {recipeUpdates.map((update) => (
                        <div
                          key={update.id}
                          className="bg-white rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              {getChangeTypeLabel(update.updateType)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getTimeSince(update.updatedAt)}
                            </span>
                          </div>

                          {update.changedField && (
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Field:</strong> {update.changedField}
                            </p>
                          )}

                          {update.oldValue && update.newValue && (
                            <div className="text-sm">
                              <p className="text-gray-600 mb-1">
                                <strong>From:</strong> {update.oldValue}
                              </p>
                              <p className="text-gray-900">
                                <strong>To:</strong> {update.newValue}
                              </p>
                            </div>
                          )}

                          {update.allergenImpact && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                              <AlertTriangle size={14} />
                              <span>Allergen impact detected</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Footer */}
      {updates.length > 0 && (
        <div className="bg-white/70 backdrop-blur-2xl rounded-2xl border border-gray-200/60 shadow-lg p-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recipes Affected</p>
              <p className="text-3xl font-bold text-gray-900">{updates.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Changes</p>
              <p className="text-3xl font-bold text-gray-900">
                {updates.reduce((sum, u) => sum + u.changeCount, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Time Period</p>
              <p className="text-lg font-semibold text-gray-900">{daysFilter} days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
