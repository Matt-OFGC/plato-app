"use client";

import { useState } from "react";
import { confirmPriceUpdate, updateIngredientPrice } from "@/app/dashboard/ingredients/actions";
import { formatCurrency } from "@/lib/currency";

interface PriceConfirmationModalProps {
  ingredient: {
    id: number;
    name: string;
    packPrice: number;
    currency: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PriceConfirmationModal({
  ingredient,
  isOpen,
  onClose,
  onSuccess,
}: PriceConfirmationModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPrice, setNewPrice] = useState(ingredient.packPrice.toString());
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmSamePrice = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      await confirmPriceUpdate(ingredient.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm price");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrice = async () => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      setError("Please enter a valid price");
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await updateIngredientPrice(ingredient.id, priceValue);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update price");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setShowPriceInput(false);
      setNewPrice(ingredient.packPrice.toString());
      setError(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Confirm Price</h2>
          <p className="text-sm text-gray-600 mt-1">{ingredient.name}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {!showPriceInput ? (
            <>
              <p className="text-gray-700 mb-4">
                Is this still the current price?
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(ingredient.packPrice, ingredient.currency)}
                </p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-4">Enter the new price:</p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Price ({ingredient.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => {
                    setNewPrice(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {!showPriceInput ? (
            <>
              <button
                onClick={handleClose}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPriceInput(true)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-emerald-300 bg-white text-emerald-700 rounded-lg font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Price Changed
              </button>
              <button
                onClick={handleConfirmSamePrice}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Yes, Still Same"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowPriceInput(false);
                  setNewPrice(ingredient.packPrice.toString());
                  setError(null);
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdating || !newPrice || parseFloat(newPrice) < 0}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Update Price"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

