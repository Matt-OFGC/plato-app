"use client";

import { useState } from "react";

interface FoodCostSettingsProps {
  initialTargetFoodCost: number;
  initialMaxFoodCost: number;
}

export function FoodCostSettings({ initialTargetFoodCost, initialMaxFoodCost }: FoodCostSettingsProps) {
  const [targetFoodCost, setTargetFoodCost] = useState(initialTargetFoodCost);
  const [maxFoodCost, setMaxFoodCost] = useState(initialMaxFoodCost);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetFoodCost: parseFloat(targetFoodCost.toString()),
          maxFoodCost: parseFloat(maxFoodCost.toString())
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Food cost targets saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to save food cost targets' });
      }
    } catch (error) {
      console.error('Error saving food cost targets:', error);
      setMessage({ type: 'error', text: 'Failed to save food cost targets. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Cost Targets</h3>
      <p className="text-sm text-gray-600 mb-4">Set your ideal food cost percentages</p>
      
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Target Food Cost %
            <span className="text-xs text-emerald-600 ml-2">Industry standard: 25%</span>
          </label>
          <input 
            type="number" 
            step="1"
            min="10"
            max="50"
            value={targetFoodCost}
            onChange={(e) => setTargetFoodCost(parseFloat(e.target.value) || 25)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="25"
          />
          <p className="text-xs text-gray-500 mt-1">Your ideal food cost percentage (lower is better)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Maximum Food Cost %
            <span className="text-xs text-amber-600 ml-2">Typically 30-35%</span>
          </label>
          <input 
            type="number" 
            step="1"
            min="20"
            max="60"
            value={maxFoodCost}
            onChange={(e) => setMaxFoodCost(parseFloat(e.target.value) || 35)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="35"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum acceptable food cost before alerts</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            <strong>💡 How it works:</strong> If your target is 25%, a recipe costing £1 should sell for £4. 
            Plato will auto-calculate suggested prices based on your targets.
          </p>
        </div>
        <button 
          type="submit"
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Food Cost Targets'}
        </button>
      </form>
    </div>
  );
}
