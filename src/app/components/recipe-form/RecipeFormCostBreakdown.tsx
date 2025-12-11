"use client";

import { formatCurrency } from "@/lib/currency";

interface RecipeFormCostBreakdownProps {
  totalCost: number;
  costPerUnit: number;
}

export function RecipeFormCostBreakdown({
  totalCost,
  costPerUnit,
}: RecipeFormCostBreakdownProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 sticky top-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-emerald-200">
          <span className="text-gray-700">Total Cost:</span>
          <span className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCost)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-700">Cost per:</span>
          <span className="text-xl font-semibold text-emerald-600">{formatCurrency(costPerUnit)}</span>
        </div>
      </div>
    </div>
  );
}








