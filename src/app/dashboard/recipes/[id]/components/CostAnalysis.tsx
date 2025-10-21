"use client";

import { calcTotalCost } from "@/app/lib/recipe-scaling";
import { useMemo, useState, useEffect, useRef } from "react";
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
  
  // Editable sell price with default 3x markup
  const [sellPrice, setSellPrice] = useState(costPerServing * 3);
  const prevCostRef = useRef(costPerServing);
  
  // Update sell price when cost per serving changes significantly (auto-adjust to 3x)
  useEffect(() => {
    if (Math.abs(prevCostRef.current - costPerServing) > 0.01 && costPerServing > 0) {
      setSellPrice(costPerServing * 3);
      prevCostRef.current = costPerServing;
    }
  }, [costPerServing]);

  // Calculate COGS percentage
  const cogsPercentage = sellPrice > 0 ? (costPerServing / sellPrice) * 100 : 0;
  
  // Determine COGS health status
  const getCogsStatus = () => {
    if (cogsPercentage <= 25) return { color: "text-emerald-600", bg: "bg-emerald-50", text: "Excellent" };
    if (cogsPercentage <= 33) return { color: "text-green-600", bg: "bg-green-50", text: "Good" };
    if (cogsPercentage <= 40) return { color: "text-yellow-600", bg: "bg-yellow-50", text: "Fair" };
    return { color: "text-red-600", bg: "bg-red-50", text: "Too High" };
  };
  
  const cogsStatus = getCogsStatus();

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
              {recipeType === "batch" ? "Cost Per Slice" : "Cost Per Unit"}
            </span>
            <span className="text-base font-semibold text-gray-900">
              £{costPerServing.toFixed(2)}
            </span>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Editable Sell Price */}
          <div className="pt-1">
            <label className="block text-sm text-gray-600 mb-2">
              Sell Price (£)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-400">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice.toFixed(2)}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-base font-semibold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* COGS Percentage with Status */}
          <div className={`${cogsStatus.bg} rounded-lg p-3 border-2 ${cogsStatus.bg === 'bg-emerald-50' ? 'border-emerald-200' : cogsStatus.bg === 'bg-green-50' ? 'border-green-200' : cogsStatus.bg === 'bg-yellow-50' ? 'border-yellow-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                COGS %
              </span>
              <span className={`text-xs font-bold ${cogsStatus.color} uppercase`}>
                {cogsStatus.text}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${cogsStatus.color}`}>
                {cogsPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">
                (Target: 25-33%)
              </span>
            </div>
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

