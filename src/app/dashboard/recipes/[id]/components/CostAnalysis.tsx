"use client";

import { RecipeMock } from "@/app/lib/mocks/recipe";
import { calcTotalCost } from "@/app/lib/recipe-scaling";
import { useMemo } from "react";

interface CostAnalysisProps {
  recipe: RecipeMock;
  servings: number;
  baseServings: number;
  recipeType: "single" | "batch";
  slicesPerBatch: number;
}

export default function CostAnalysis({
  recipe,
  servings,
  baseServings,
  recipeType,
  slicesPerBatch,
}: CostAnalysisProps) {
  const totalCost = useMemo(() => {
    return calcTotalCost(recipe.ingredients, baseServings, servings);
  }, [recipe.ingredients, baseServings, servings]);

  const costPerServing = recipeType === "batch" 
    ? totalCost / slicesPerBatch 
    : totalCost;
  const sellPrice = costPerServing * 3; // Example markup

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Cost Analysis
        </p>
      </div>

      {/* Cost Breakdown */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {recipeType === "batch" ? "Batch Cost" : "Recipe Cost"}
          </span>
          <span className="text-lg font-bold text-emerald-600">
            £{totalCost.toFixed(2)}
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {recipeType === "batch" ? "Per Slice" : "Per Unit"}
          </span>
          <span className="text-base font-semibold text-gray-900">
            £{costPerServing.toFixed(2)}
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-gray-600">Sell Price</span>
          <span className="text-base font-semibold text-gray-900">
            £{sellPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

