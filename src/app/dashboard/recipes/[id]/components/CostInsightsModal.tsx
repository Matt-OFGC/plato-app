"use client";

import { useState } from "react";

interface CostInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCost: number;
  costPerServing: number;
  recipeType: "single" | "batch";
  slicesPerBatch: number;
}

export default function CostInsightsModal({
  isOpen,
  onClose,
  totalCost,
  costPerServing,
  recipeType,
  slicesPerBatch,
}: CostInsightsModalProps) {
  const [sellPrice, setSellPrice] = useState(costPerServing * 3);

  if (!isOpen) return null;

  // Calculate metrics
  const profit = sellPrice - costPerServing;
  const profitMargin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
  const foodCostPercentage = sellPrice > 0 ? (costPerServing / sellPrice) * 100 : 0;
  const markup = costPerServing > 0 ? ((sellPrice - costPerServing) / costPerServing) * 100 : 0;

  // Determine health status
  const getHealthStatus = () => {
    if (foodCostPercentage <= 25) return { color: "emerald", text: "Excellent", iconType: "check" };
    if (foodCostPercentage <= 33) return { color: "green", text: "Good", iconType: "check" };
    if (foodCostPercentage <= 40) return { color: "yellow", text: "Fair", iconType: "alert" };
    return { color: "red", text: "Poor", iconType: "alert" };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cost Insights & Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Optimize your pricing and profit margins</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/80 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Cost Summary */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Current Cost Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {recipeType === "batch" ? "Batch Cost" : "Recipe Cost"}
                </p>
                <p className="text-2xl font-bold text-gray-900">£{totalCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {recipeType === "batch" ? `Per Slice (${slicesPerBatch} total)` : "Per Unit"}
                </p>
                <p className="text-2xl font-bold text-emerald-600">£{costPerServing.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Interactive Pricing Calculator */}
          <div className="bg-white rounded-xl p-5 border-2 border-emerald-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Pricing Calculator
            </h3>
            
            {/* Sell Price Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Sell Price (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice.toFixed(2)}
                onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            {/* Quick Markup Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[2, 2.5, 3, 4].map((multiplier) => (
                <button
                  key={multiplier}
                  onClick={() => setSellPrice(costPerServing * multiplier)}
                  className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 rounded-lg transition-colors"
                >
                  {multiplier}x
                </button>
              ))}
            </div>

            {/* Calculated Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                <p className="text-xs text-gray-600 mb-1">Profit per Item</p>
                <p className="text-2xl font-bold text-emerald-700">£{profit.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {profitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className={`bg-gradient-to-br rounded-lg p-4 border ${
                healthStatus.color === "emerald" || healthStatus.color === "green"
                  ? "from-emerald-50 to-green-50 border-emerald-200"
                  : healthStatus.color === "yellow"
                  ? "from-yellow-50 to-orange-50 border-yellow-200"
                  : "from-red-50 to-pink-50 border-red-200"
              }`}>
                <p className="text-xs text-gray-600 mb-1">Food Cost %</p>
                <p className={`text-2xl font-bold ${
                  healthStatus.color === "emerald" || healthStatus.color === "green"
                    ? "text-emerald-700"
                    : healthStatus.color === "yellow"
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}>
                  {foodCostPercentage.toFixed(1)}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {healthStatus.iconType === "check" ? (
                    <svg className={`w-3 h-3 ${
                      healthStatus.color === "emerald" || healthStatus.color === "green"
                        ? "text-emerald-600"
                        : healthStatus.color === "yellow"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className={`w-3 h-3 ${
                      healthStatus.color === "emerald" || healthStatus.color === "green"
                        ? "text-emerald-600"
                        : healthStatus.color === "yellow"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <p className={`text-xs font-medium ${
                    healthStatus.color === "emerald" || healthStatus.color === "green"
                      ? "text-emerald-600"
                      : healthStatus.color === "yellow"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}>
                    {healthStatus.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Markup Percentage */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Markup</span>
                <span className="text-lg font-bold text-gray-900">{markup.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Industry Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Industry Recommendations
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Ideal Food Cost: 25-33%</p>
                  <p className="text-xs text-gray-600">Most profitable range for food businesses</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Acceptable Range: 33-40%</p>
                  <p className="text-xs text-gray-600">Still viable, but less room for overheads</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Too High: Above 40%</p>
                  <p className="text-xs text-gray-600">May not cover labor, rent, and other costs</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Cost Percentage Breakdown
            </h3>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  foodCostPercentage <= 25
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : foodCostPercentage <= 33
                    ? "bg-gradient-to-r from-green-500 to-green-400"
                    : foodCostPercentage <= 40
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                    : "bg-gradient-to-r from-red-500 to-red-400"
                }`}
                style={{ width: `${Math.min(foodCostPercentage, 100)}%` }}
              >
                <div className="h-full flex items-center justify-center text-xs font-bold text-white">
                  {foodCostPercentage.toFixed(1)}% Food Cost
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span className="text-emerald-600 font-medium">25%</span>
              <span className="text-yellow-600 font-medium">33%</span>
              <span className="text-red-600 font-medium">40%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Recommendations Based on Current Metrics */}
          {foodCostPercentage > 40 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Action Recommended</h4>
                  <p className="text-sm text-red-800 mb-3">
                    Your food cost percentage is above the recommended range. Consider:
                  </p>
                  <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                    <li>Increasing your sell price to £{(costPerServing / 0.33).toFixed(2)} or more</li>
                    <li>Finding more cost-effective ingredient suppliers</li>
                    <li>Adjusting portion sizes if appropriate</li>
                    <li>Reviewing ingredient quantities for waste reduction</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {foodCostPercentage <= 25 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900 mb-2">Excellent Pricing!</h4>
                  <p className="text-sm text-emerald-800">
                    Your food cost percentage is in the ideal range. This gives you excellent profit margins
                    while maintaining competitive pricing. Keep monitoring ingredient costs to maintain this ratio.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

