"use client";

import React, { useState, useEffect } from "react";

interface BatchPricingTier {
  packQuantity: number;
  packPrice: number;
}

interface BatchPricingInputProps {
  packUnit: string;
  initialBatchPricing?: Array<{ packQuantity: number; packPrice: number }> | null;
}

export function BatchPricingInput({ packUnit, initialBatchPricing }: BatchPricingInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tiers, setTiers] = useState<BatchPricingTier[]>(
    initialBatchPricing && initialBatchPricing.length > 0
      ? initialBatchPricing.map(t => ({ packQuantity: t.packQuantity, packPrice: t.packPrice }))
      : []
  );

  // Update hidden input when tiers change
  useEffect(() => {
    const hiddenInput = document.getElementById('batchPricing') as HTMLInputElement;
    if (hiddenInput) {
      if (tiers.length === 0) {
        hiddenInput.value = '';
      } else {
        hiddenInput.value = JSON.stringify(tiers);
      }
    }
  }, [tiers]);

  const addTier = () => {
    setTiers([...tiers, { packQuantity: 0, packPrice: 0 }]);
    setIsExpanded(true);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: 'packQuantity' | 'packPrice', value: number) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Batch Pricing (Optional)
          </label>
          <p className="text-xs text-gray-600">
            Add bulk pricing tiers (e.g., case of 6 for £15.99 vs single for £4.99)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        id="batchPricing"
        name="batchPricing"
        value={tiers.length > 0 ? JSON.stringify(tiers) : ''}
      />

      {isExpanded && (
        <div className="space-y-3">
          {tiers.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No batch pricing tiers added. Click "Add Tier" to create one.
            </p>
          ) : (
            tiers.map((tier, index) => (
              <div
                key={index}
                className="bg-white border border-gray-300 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity ({packUnit || 'units'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.packQuantity || ''}
                      onChange={(e) =>
                        updateTier(index, 'packQuantity', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., 6"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.packPrice || ''}
                      onChange={(e) =>
                        updateTier(index, 'packPrice', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., 15.99"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove tier"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={addTier}
            className="w-full px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            + Add Batch Pricing Tier
          </button>
          {tiers.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> The system will automatically use the cheapest pricing tier when calculating costs.
                {tiers.some(t => t.packQuantity > 0 && t.packPrice > 0) && (
                  <span className="block mt-1">
                    Current savings: {tiers
                      .filter(t => t.packQuantity > 0 && t.packPrice > 0)
                      .map(t => {
                        const costPerUnit = t.packPrice / t.packQuantity;
                        return `${t.packQuantity} ${packUnit || 'units'} for £${t.packPrice.toFixed(2)} (£${costPerUnit.toFixed(2)}/${packUnit || 'unit'})`;
                      })
                      .join(', ')}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

