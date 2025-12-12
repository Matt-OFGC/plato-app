"use client";

import { useState } from "react";

interface StaleIngredient {
  id: number;
  name: string;
  packPrice: number;
  currency: string;
  daysSinceUpdate: number;
  supplier?: string;
}

interface StalePriceBulkUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staleIngredients: StaleIngredient[];
}

interface PriceUpdate {
  ingredientId: number;
  newPrice: string;
  selected: boolean;
}

export function StalePriceBulkUpdate({
  isOpen,
  onClose,
  onSuccess,
  staleIngredients,
}: StalePriceBulkUpdateProps) {
  const [updates, setUpdates] = useState<PriceUpdate[]>(
    staleIngredients.map(ing => ({
      ingredientId: ing.id,
      newPrice: ing.packPrice.toString(),
      selected: true,
    }))
  );
  const [updating, setUpdating] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  if (!isOpen) return null;

  const handlePriceChange = (ingredientId: number, newPrice: string) => {
    setUpdates(prev =>
      prev.map(u =>
        u.ingredientId === ingredientId ? { ...u, newPrice } : u
      )
    );
  };

  const handleToggle = (ingredientId: number) => {
    setUpdates(prev =>
      prev.map(u =>
        u.ingredientId === ingredientId ? { ...u, selected: !u.selected } : u
      )
    );
  };

  const handleSelectAll = () => {
    const allSelected = updates.every(u => u.selected);
    setUpdates(prev => prev.map(u => ({ ...u, selected: !allSelected })));
  };

  const handleBulkUpdate = async () => {
    setUpdating(true);
    let success = 0;
    let errors = 0;

    const selectedUpdates = updates.filter(u => u.selected);

    for (const update of selectedUpdates) {
      const ingredient = staleIngredients.find(i => i.id === update.ingredientId);
      if (!ingredient) continue;

      try {
        const response = await fetch(`/api/ingredients/${update.ingredientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            packPrice: parseFloat(update.newPrice),
          }),
        });

        if (response.ok) {
          success++;
        } else {
          errors++;
        }
      } catch (err) {
        errors++;
      }

      setSuccessCount(success);
      setErrorCount(errors);
    }

    setUpdating(false);

    if (success > 0) {
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }
  };

  const selectedCount = updates.filter(u => u.selected).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Update Stale Prices
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Update prices for {staleIngredients.length} ingredients with outdated pricing
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {updating && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-900 font-medium">Updating prices...</span>
                <span className="text-blue-700">
                  {successCount + errorCount} / {selectedCount}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((successCount + errorCount) / selectedCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {successCount > 0 && !updating && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-emerald-900">Prices updated!</p>
                  <p className="text-sm text-emerald-700">
                    {successCount} prices updated successfully
                    {errorCount > 0 && `, ${errorCount} failed`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={updates.every(u => u.selected)}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Ingredient</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Days Since Update</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Current Price</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">New Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staleIngredients.map((ingredient, index) => {
                    const update = updates[index];
                    return (
                      <tr key={ingredient.id} className={update.selected ? "bg-emerald-50/30" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={update.selected}
                            onChange={() => handleToggle(ingredient.id)}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{ingredient.name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ingredient.supplier || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ingredient.daysSinceUpdate > 60
                              ? 'bg-red-100 text-red-700'
                              : ingredient.daysSinceUpdate > 30
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {ingredient.daysSinceUpdate} days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {ingredient.currency} {ingredient.packPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{ingredient.currency}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={update.newPrice}
                              onChange={(e) => handlePriceChange(ingredient.id, e.target.value)}
                              disabled={!update.selected || updating}
                              className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:bg-gray-100"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>{selectedCount} of {staleIngredients.length} selected</span>
            <button
              onClick={handleSelectAll}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {updates.every(u => u.selected) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updating}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={selectedCount === 0 || updating}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : `Update ${selectedCount} Prices`}
          </button>
        </div>
      </div>
    </div>
  );
}
