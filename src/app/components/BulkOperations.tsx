"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkOperationsProps {
  selectedIds: number[];
  onComplete: () => void;
  type: "ingredients" | "recipes";
}

export function BulkOperations({ selectedIds, onComplete, type }: BulkOperationsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">("percentage");
  const [processing, setProcessing] = useState(false);

  async function handleBulkPriceUpdate() {
    if (!priceAdjustment) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/${type}/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientIds: selectedIds,
          updates: {
            priceAdjustment: parseFloat(priceAdjustment),
            adjustmentType,
          },
        }),
      });

      if (res.ok) {
        alert(`Successfully updated ${selectedIds.length} items`);
        setOperation(null);
        setPriceAdjustment("");
        onComplete();
      } else {
        alert("Failed to update items");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setProcessing(false);
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/${type}/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientIds: selectedIds,
        }),
      });

      if (res.ok) {
        alert(`Successfully deleted ${selectedIds.length} items`);
        onComplete();
      } else {
        alert("Failed to delete items");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setProcessing(false);
    }
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border border-gray-300 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {selectedIds.length}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOperation("price")}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Prices
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={processing}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={onComplete}
            className="px-4 py-2 text-gray-700 text-sm hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>

      {/* Price Update Modal */}
      <AnimatePresence>
        {operation === "price" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setOperation(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Bulk Price Update
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Updating {selectedIds.length} ingredients
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage Change</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {adjustmentType === "percentage" ? "Percentage (%)" : "Amount (£)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={priceAdjustment}
                    onChange={(e) => setPriceAdjustment(e.target.value)}
                    placeholder={adjustmentType === "percentage" ? "e.g., 10 for 10% increase" : "e.g., 0.50"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {adjustmentType === "percentage" 
                      ? "Use negative values for decreases (e.g., -10 for 10% decrease)"
                      : "Use negative values for decreases"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setOperation(null)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkPriceUpdate}
                  disabled={processing || !priceAdjustment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processing ? "Updating..." : "Update Prices"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

