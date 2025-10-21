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
  sellPrice: number;
  onSellPriceChange: (price: number) => void;
}

export default function CostAnalysis({
  ingredients,
  servings,
  baseServings,
  recipeType,
  slicesPerBatch,
  sellPrice,
  onSellPriceChange,
}: CostAnalysisProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState(sellPrice.toString());

  const totalCost = useMemo(() => {
    return calcTotalCost(ingredients, baseServings, servings);
  }, [ingredients, baseServings, servings]);

  const costPerServing = recipeType === "batch" 
    ? totalCost / slicesPerBatch 
    : totalCost;
  
  // Update input value when sellPrice prop changes
  useEffect(() => {
    setInputValue(sellPrice.toFixed(2));
  }, [sellPrice]);

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
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Cost Analysis
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded-lg hover:bg-emerald-100 transition-colors group"
            title="View detailed insights"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>

        {/* Cost Breakdown */}
        <div className="p-4 space-y-2.5">
          {/* Batch Cost */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {recipeType === "batch" ? "Batch Cost" : "Recipe Cost"}
            </span>
            <span className="text-base font-bold text-emerald-600">
              £{totalCost.toFixed(2)}
            </span>
          </div>

          {/* Cost Per Serving */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {recipeType === "batch" ? "Per Slice" : "Per Unit"}
            </span>
            <span className="text-base font-semibold text-gray-900">
              £{costPerServing.toFixed(2)}
            </span>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* Editable Sell Price */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Sell Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">£</span>
              <input
                type="text"
                placeholder="0.00"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed) && parsed >= 0) {
                    onSellPriceChange(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseFloat(inputValue);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setInputValue(parsed.toFixed(2));
                  } else {
                    setInputValue(sellPrice.toFixed(2));
                  }
                }}
                className="w-full pl-7 pr-3 py-2 text-base font-semibold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="h-px bg-gray-100 my-2" />

          {/* COGS Percentage - Compact Version */}
          <div className={`${cogsStatus.bg} rounded-lg p-2.5 border ${cogsStatus.bg === 'bg-emerald-50' ? 'border-emerald-200' : cogsStatus.bg === 'bg-green-50' ? 'border-green-200' : cogsStatus.bg === 'bg-yellow-50' ? 'border-yellow-200' : 'border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">COGS %</div>
                <div className={`text-xl font-bold ${cogsStatus.color}`}>
                  {cogsPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xs font-bold ${cogsStatus.color} uppercase mb-0.5`}>
                  {cogsStatus.text}
                </div>
                <div className="text-xs text-gray-500">
                  Target: 25-33%
                </div>
              </div>
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
        sellPrice={sellPrice}
        onSellPriceChange={onSellPriceChange}
      />
    </>
  );
}

