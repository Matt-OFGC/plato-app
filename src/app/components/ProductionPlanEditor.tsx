"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  categoryId: number | null;
}

interface ProductionItem {
  id: number;
  recipeId: number;
  quantity: number;
  completed: boolean;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  items: ProductionItem[];
}

interface ProductionPlanEditorProps {
  plan: ProductionPlan;
  recipes: Recipe[];
  companyId: number;
}

export function ProductionPlanEditor({
  plan,
  recipes,
  companyId,
}: ProductionPlanEditorProps) {
  const router = useRouter();
  const [planName, setPlanName] = useState(plan.name);
  const [startDate, setStartDate] = useState(format(new Date(plan.startDate), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(plan.endDate), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Convert existing items to custom yields map
  const [customYields, setCustomYields] = useState<{ [key: number]: number }>(() => {
    const yields: { [key: number]: number } = {};
    plan.items.forEach((item) => {
      const recipeYield = parseFloat(item.recipe.yieldQuantity);
      yields[item.recipeId] = item.quantity * recipeYield;
    });
    return yields;
  });

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleSave() {
    if (!planName) {
      alert("Plan name is required");
      return;
    }

    const items = Object.entries(customYields)
      .filter(([_, yield_value]) => yield_value > 0)
      .map(([recipeId, customYield]) => {
        const recipe = recipes.find(r => r.id === parseInt(recipeId));
        if (!recipe) return null;
        
        const recipeYield = parseFloat(recipe.yieldQuantity);
        const batches = customYield / recipeYield;
        
        return {
          recipeId: parseInt(recipeId),
          quantity: batches,
        };
      })
      .filter(Boolean);

    if (items.length === 0) {
      alert("Please select at least one recipe");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/production/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          items,
          companyId,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/production");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update plan");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this production plan? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/production/plans/${plan.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/production");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete plan");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Plan Details */}
        <div className="mb-6 pb-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Week 42 Production"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Recipe Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Recipes
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or category..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Recipe Selection */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recipes & Quantities</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredRecipes.map((recipe) => {
              const customYield = customYields[recipe.id] || 0;
              const recipeYield = parseFloat(recipe.yieldQuantity);
              const batches = customYield > 0 ? customYield / recipeYield : 0;
              
              return (
                <div
                  key={recipe.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    customYield > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                    <p className="text-sm text-gray-500">
                      Yields: {recipe.yieldQuantity} {recipe.yieldUnit} per batch
                      {recipe.category && ` • ${recipe.category}`}
                    </p>
                    {customYield > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        = {batches % 1 === 0 ? batches : batches.toFixed(2)} batch{batches !== 1 ? 'es' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">
                      Total {recipe.yieldUnit}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={recipeYield}
                      value={customYield || ""}
                      placeholder="0"
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setCustomYields({
                          ...customYields,
                          [recipe.id]: value,
                        });
                      }}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                    {customYield > 0 && (
                      <button
                        onClick={() => {
                          const { [recipe.id]: _, ...rest } = customYields;
                          setCustomYields(rest);
                        }}
                        className="p-2 text-red-500 hover:text-red-700"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t flex items-center justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete Plan
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/production")}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !planName}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

