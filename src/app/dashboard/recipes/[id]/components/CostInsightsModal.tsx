"use client";

import { useState, useEffect } from "react";

interface CostInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCost: number;
  costPerServing: number;
  recipeType: "single" | "batch";
  slicesPerBatch: number;
  sellPrice: number;
  onSellPriceChange: (price: number) => void;
  recipeId: number;
  onSave: (price: number) => Promise<void>;
  wholesalePrice?: number;
  isWholesaleProduct?: boolean;
  onWholesalePriceChange?: (price: number) => void;
  onWholesaleToggle?: (checked: boolean) => void;
  onSaveWholesale?: (price: number, isWholesaleProduct: boolean) => Promise<void>;
  yieldUnit?: string;
}

export default function CostInsightsModal({
  isOpen,
  onClose,
  totalCost,
  costPerServing,
  recipeType,
  slicesPerBatch,
  sellPrice,
  onSellPriceChange,
  recipeId,
  onSave,
  wholesalePrice = 0,
  isWholesaleProduct = false,
  onWholesalePriceChange,
  onWholesaleToggle,
  onSaveWholesale,
  yieldUnit = "each",
}: CostInsightsModalProps) {
  const [inputValue, setInputValue] = useState(sellPrice.toString());
  const [localSellPrice, setLocalSellPrice] = useState(sellPrice);
  const [wholesaleInputValue, setWholesaleInputValue] = useState(wholesalePrice.toString());
  const [localWholesalePrice, setLocalWholesalePrice] = useState(wholesalePrice);
  const [localIsWholesaleProduct, setLocalIsWholesaleProduct] = useState(isWholesaleProduct);
  const [isSaving, setIsSaving] = useState(false);
  
  // Update input values when modal opens or props change
  useEffect(() => {
    setInputValue(sellPrice.toFixed(2));
    setLocalSellPrice(sellPrice);
    setWholesaleInputValue(wholesalePrice.toFixed(2));
    setLocalWholesalePrice(wholesalePrice);
    setLocalIsWholesaleProduct(isWholesaleProduct);
  }, [sellPrice, wholesalePrice, isWholesaleProduct, isOpen]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save retail price
      await onSave(localSellPrice);
      onSellPriceChange(localSellPrice);
      
      // Save wholesale price if handler provided
      if (onSaveWholesale) {
        await onSaveWholesale(localWholesalePrice, localIsWholesaleProduct);
        if (onWholesalePriceChange) {
          onWholesalePriceChange(localWholesalePrice);
        }
        if (onWholesaleToggle) {
          onWholesaleToggle(localIsWholesaleProduct);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save prices:', error);
      alert('Failed to save prices');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Calculate metrics using local sell price for real-time preview
  const profit = localSellPrice - costPerServing;
  const profitMargin = localSellPrice > 0 ? (profit / localSellPrice) * 100 : 0;
  const foodCostPercentage = localSellPrice > 0 ? (costPerServing / localSellPrice) * 100 : 0;
  const markup = costPerServing > 0 ? ((localSellPrice - costPerServing) / costPerServing) * 100 : 0;

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

          {/* Interactive Pricing Calculator - Retail */}
          <div className="bg-white rounded-xl p-5 border-2 border-emerald-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Retail Pricing Calculator
            </h3>
            
            {/* Sell Price Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Sell Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">£</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setLocalSellPrice(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(inputValue);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setInputValue(parsed.toFixed(2));
                      setLocalSellPrice(parsed);
                    } else {
                      setInputValue(localSellPrice.toFixed(2));
                    }
                  }}
                  className="w-full pl-9 pr-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Quick Markup Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[2, 2.5, 3, 4].map((multiplier) => (
                <button
                  key={multiplier}
                  onClick={() => {
                    const newPrice = costPerServing * multiplier;
                    setLocalSellPrice(newPrice);
                    setInputValue(newPrice.toFixed(2));
                  }}
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

          {/* Wholesale Pricing Section */}
          {onSaveWholesale && (
            <div className="bg-white rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="isWholesaleProduct"
                  checked={localIsWholesaleProduct}
                  onChange={(e) => setLocalIsWholesaleProduct(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isWholesaleProduct" className="text-sm font-semibold text-gray-700 flex items-center gap-2 cursor-pointer">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Available for Wholesale
                </label>
              </div>

              {localIsWholesaleProduct && (
                <>
                  {/* Wholesale Price Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wholesale Price Per Unit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">£</span>
                      <input
                        type="text"
                        placeholder="0.00"
                        value={wholesaleInputValue}
                        onChange={(e) => {
                          setWholesaleInputValue(e.target.value);
                          const parsed = parseFloat(e.target.value);
                          if (!isNaN(parsed) && parsed >= 0) {
                            setLocalWholesalePrice(parsed);
                          }
                        }}
                        onBlur={() => {
                          const parsed = parseFloat(wholesaleInputValue);
                          if (!isNaN(parsed) && parsed >= 0) {
                            setWholesaleInputValue(parsed.toFixed(2));
                            setLocalWholesalePrice(parsed);
                          } else {
                            setWholesaleInputValue(localWholesalePrice.toFixed(2));
                          }
                        }}
                        className="w-full pl-9 pr-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Price per {yieldUnit}
                    </p>
                  </div>

                  {/* Quick Markup Buttons for Wholesale */}
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {[2, 2.5, 3, 4].map((multiplier) => (
                      <button
                        key={multiplier}
                        onClick={() => {
                          const newPrice = costPerServing * multiplier;
                          setLocalWholesalePrice(newPrice);
                          setWholesaleInputValue(newPrice.toFixed(2));
                        }}
                        className="px-3 py-2 text-sm font-medium bg-gray-100 hover:bg-green-100 hover:text-green-700 rounded-lg transition-colors"
                      >
                        {multiplier}x
                      </button>
                    ))}
                  </div>

                  {/* Wholesale Metrics */}
                  {(() => {
                    const wholesaleProfit = localWholesalePrice - costPerServing;
                    const wholesaleProfitMargin = localWholesalePrice > 0 ? (wholesaleProfit / localWholesalePrice) * 100 : 0;
                    const wholesaleFoodCostPercentage = localWholesalePrice > 0 ? (costPerServing / localWholesalePrice) * 100 : 0;
                    const wholesaleMarkup = costPerServing > 0 ? ((localWholesalePrice - costPerServing) / costPerServing) * 100 : 0;

                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Wholesale Profit</p>
                          <p className="text-2xl font-bold text-green-700">£{wholesaleProfit.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {wholesaleProfitMargin.toFixed(1)}% margin
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Wholesale Markup</p>
                          <p className="text-2xl font-bold text-green-700">{wholesaleMarkup.toFixed(0)}%</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Food Cost: {wholesaleFoodCostPercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Industry Recommendations */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Industry Recommendations
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Ideal Food Cost: 25-33%</p>
                <p className="text-xs text-gray-600">Most profitable range for food businesses</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Acceptable Range: 33-40%</p>
                <p className="text-xs text-gray-600">Still viable, but less room for overheads</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Too High: Above 40%</p>
                <p className="text-xs text-gray-600">May not cover labor, rent, and other costs</p>
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
              <span>25%</span>
              <span>33%</span>
              <span>40%</span>
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Price
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

