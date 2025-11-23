"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { analyzeRecipeFoodCost, formatFoodCost } from "@/lib/pricing";
import { formatLastUpdate } from "@/lib/priceTracking";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

interface Recipe {
  id: number;
  name: string;
  cost: number;
  sellingPrice: number | null;
  targetFoodCost: number | null;
  maxFoodCost: number | null;
  currency: string;
}

interface Ingredient {
  id: number;
  name: string;
  lastPriceUpdate: Date;
  daysSinceUpdate: number;
}

interface DashboardInboxProps {
  recipes: Recipe[];
  staleIngredients: Ingredient[];
  targetFoodCost: number;
  maxFoodCost: number;
}

export function DashboardInbox({ 
  recipes, 
  staleIngredients,
  targetFoodCost,
  maxFoodCost 
}: DashboardInboxProps) {
  const { toAppRoute } = useAppAwareRoute();
  const [activeTab, setActiveTab] = useState<'all' | 'prices' | 'ingredients' | 'ideas'>('all');

  // Analyze recipes for food cost issues
  const recipesNeedingAttention = recipes
    .map(recipe => ({
      ...recipe,
      analysis: analyzeRecipeFoodCost(
        recipe.cost,
        recipe.sellingPrice,
        recipe.targetFoodCost || targetFoodCost,
        recipe.maxFoodCost || maxFoodCost
      )
    }))
    .filter(r => r.analysis.status !== 'good')
    .sort((a, b) => {
      // Sort by urgency: poor > warning > no-price
      const order = { poor: 0, warning: 1, 'no-price': 2, good: 3 };
      return order[a.analysis.status] - order[b.analysis.status];
    });

  const urgentCount = recipesNeedingAttention.filter(r => r.analysis.status === 'poor').length;
  const staleIngredientsUrgent = staleIngredients.filter(i => i.daysSinceUpdate >= 365);
  const staleIngredientsWarning = staleIngredients.filter(i => i.daysSinceUpdate >= 180 && i.daysSinceUpdate < 365);

  const totalIssues = urgentCount + staleIngredientsUrgent.length + recipesNeedingAttention.filter(r => r.analysis.status === 'warning').length + staleIngredientsWarning.length;

  if (totalIssues === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">All Good! 🎉</h3>
            <p className="text-xs text-emerald-700">No pricing issues detected. Your recipes are on target.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
              <p className="text-xs text-gray-600">{totalIssues} items need attention</p>
            </div>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {urgentCount} urgent
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'all'
                ? 'text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({totalIssues})
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'prices'
                ? 'text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recipe Prices ({recipesNeedingAttention.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === 'ingredients'
                ? 'text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ingredients ({staleIngredients.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {(activeTab === 'all' || activeTab === 'prices') && recipesNeedingAttention.length > 0 && (
          <div className="divide-y divide-gray-100">
            {recipesNeedingAttention.slice(0, activeTab === 'all' ? 3 : 10).map(recipe => (
              <Link
                key={recipe.id}
                href={toAppRoute(`/dashboard/recipes/${recipe.id}`)}
                className="block px-6 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {recipe.analysis.status === 'poor' ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      ) : recipe.analysis.status === 'warning' ? (
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                        {recipe.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                      <span>Cost: {formatCurrency(recipe.cost, recipe.currency)}</span>
                      <span>•</span>
                      <span className={
                        recipe.analysis.status === 'poor' ? 'text-red-600 font-medium' :
                        recipe.analysis.status === 'warning' ? 'text-amber-600 font-medium' :
                        'text-gray-500'
                      }>
                        {recipe.analysis.actualFoodCost !== null 
                          ? `Food cost: ${formatFoodCost(recipe.analysis.actualFoodCost)}`
                          : 'No price set'
                        }
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'ingredients') && staleIngredients.length > 0 && (
          <div className="divide-y divide-gray-100">
            {staleIngredients.slice(0, activeTab === 'all' ? 3 : 10).map(ing => (
              <Link
                key={ing.id}
                href={toAppRoute(`/dashboard/ingredients/${ing.id}`)}
                className="block px-6 py-3 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {ing.daysSinceUpdate >= 365 ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                        {ing.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Price last updated: {formatLastUpdate(new Date(ing.lastPriceUpdate))}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalIssues === 0 && (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>All caught up! Nothing needs attention right now.</p>
          </div>
        )}

        {activeTab === 'all' && totalIssues > 6 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              {totalIssues - 6} more items • View in{" "}
              <button onClick={() => setActiveTab('prices')} className="text-emerald-600 hover:underline">
                Recipe Prices
              </button>{" "}
              or{" "}
              <button onClick={() => setActiveTab('ingredients')} className="text-emerald-600 hover:underline">
                Ingredients
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

