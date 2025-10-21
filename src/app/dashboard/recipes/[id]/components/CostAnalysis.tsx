"use client";

import { calcTotalCost } from "@/app/lib/recipe-scaling";
import { useMemo, useState } from "react";
import CostInsightsModal from "./CostInsightsModal";

interface Ingredient {
  quantity: number;
  unit: string;
  costPerUnit?: number;
}

interface CostAnalysisProps {
  ingredients: Ingredient[];
  servings: number;
  baseServings: number;
  recipeType: "single" | "batch";
  slicesPerBatch: number;
}

export default function CostAnalysis({
  ingredients,
  servings,
  baseServings,
  recipeType,
  slicesPerBatch,
}: CostAnalysisProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalCost = useMemo(() => {
    return calcTotalCost(ingredients, baseServings, servings);
  }, [ingredients, baseServings, servings]);

  const costPerServing = recipeType === "batch" 
    ? totalCost / slicesPerBatch 
    : totalCost;
  const sellPrice = costPerServing * 3; // Example markup

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Cost Analysis
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors group"
            title="View detailed insights"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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

      <CostInsightsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        totalCost={totalCost}
        costPerServing={costPerServing}
        recipeType={recipeType}
        slicesPerBatch={slicesPerBatch}
      />
    </>
  );
}

