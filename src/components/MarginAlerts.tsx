"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import {
  analyzeRecipeFoodCost,
  formatFoodCost,
  getFoodCostColorClass,
  getFoodCostStatusLabel,
} from "@/lib/pricing";

interface Recipe {
  id: number;
  name: string;
  cost: number;
  sellingPrice: number | null;
  targetFoodCost: number | null;
  maxFoodCost: number | null;
  currency: string;
}

interface FoodCostAlertsProps {
  recipes: Recipe[];
  currency?: string;
  targetFoodCost?: number;
  maxFoodCost?: number;
}

export function MarginAlerts({ 
  recipes, 
  currency = "GBP",
  targetFoodCost = 25,
  maxFoodCost = 35
}: FoodCostAlertsProps) {
  // Analyze all recipes
  const analyzedRecipes = recipes
    .map((recipe) => {
      const analysis = analyzeRecipeFoodCost(
        recipe.cost,
        recipe.sellingPrice,
        recipe.targetFoodCost || targetFoodCost,
        recipe.maxFoodCost || maxFoodCost
      );
      return { ...recipe, analysis };
    })
    .filter((r) => r.analysis.status !== "good"); // Only show recipes needing attention

  // Group by status
  const urgentRecipes = analyzedRecipes.filter((r) => r.analysis.status === "poor");
  const warningRecipes = analyzedRecipes.filter((r) => r.analysis.status === "warning");
  const noPriceRecipes = analyzedRecipes.filter((r) => r.analysis.status === "no-price");

  if (analyzedRecipes.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-900">All Recipes On Target!</h3>
            <p className="text-emerald-700">
              All your recipes are at or below your {targetFoodCost}% food cost target. Great job! 👏
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Food Cost Alerts</h2>
          <p className="text-gray-600 mt-1">
            {analyzedRecipes.length} {analyzedRecipes.length === 1 ? "recipe needs" : "recipes need"} pricing review
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Target: {targetFoodCost}% | Max: {maxFoodCost}%
        </div>
      </div>

      {/* Urgent - Below minimum margin */}
      {urgentRecipes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">
              Urgent ({urgentRecipes.length})
            </h3>
          </div>
          <div className="space-y-3">
            {urgentRecipes.map((recipe) => (
              <RecipeMarginCard key={recipe.id} recipe={recipe} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* Warning - Below target but above minimum */}
      {warningRecipes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-amber-900">
              Below Target ({warningRecipes.length})
            </h3>
          </div>
          <div className="space-y-3">
            {warningRecipes.map((recipe) => (
              <RecipeMarginCard key={recipe.id} recipe={recipe} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* No Price Set */}
      {noPriceRecipes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              No Price Set ({noPriceRecipes.length})
            </h3>
          </div>
          <div className="space-y-3">
            {noPriceRecipes.map((recipe) => (
              <RecipeMarginCard key={recipe.id} recipe={recipe} currency={currency} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeMarginCard({
  recipe,
  currency,
}: {
  recipe: Recipe & { analysis: ReturnType<typeof analyzeRecipeFoodCost> };
  currency: string;
}) {
  const { analysis } = recipe;
  const statusClass = getFoodCostColorClass(analysis.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            href={`/dashboard/recipes/${recipe.id}`}
            className="text-lg font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
          >
            {recipe.name}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
              {getFoodCostStatusLabel(analysis.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Recipe Cost</p>
          <p className="font-semibold text-gray-900">{formatCurrency(analysis.cost, currency)}</p>
        </div>
        <div>
          <p className="text-gray-500">Selling Price</p>
          <p className="font-semibold text-gray-900">
            {analysis.sellingPrice ? formatCurrency(analysis.sellingPrice, currency) : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Food Cost %</p>
          <p className="font-semibold text-gray-900">{formatFoodCost(analysis.actualFoodCost)}</p>
        </div>
        <div>
          <p className="text-gray-500">Suggested Price</p>
          <p className="font-semibold text-emerald-600">
            {formatCurrency(analysis.suggestedPrice, currency)}
          </p>
        </div>
      </div>

      {analysis.sellingPrice && analysis.suggestedPrice > analysis.sellingPrice && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Increase price by{" "}
            <span className="font-semibold text-gray-900">
              {formatCurrency(analysis.suggestedPrice - analysis.sellingPrice, currency)}
            </span>{" "}
            to reach {analysis.targetFoodCost}% food cost target
          </p>
        </div>
      )}
      {!analysis.sellingPrice && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            💡 Set selling price to{" "}
            <span className="font-semibold text-emerald-700">
              {formatCurrency(analysis.suggestedPrice, currency)}
            </span>{" "}
            for {analysis.targetFoodCost}% food cost
          </p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href={`/dashboard/recipes/${recipe.id}`}
          className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium text-center"
        >
          {analysis.sellingPrice ? "Update Price" : "Set Price"}
        </Link>
        <Link
          href={`/dashboard/recipes/${recipe.id}/view`}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          View Recipe
        </Link>
      </div>
    </div>
  );
}

