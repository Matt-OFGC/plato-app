"use client";

import { useState } from "react";

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  sellingPrice: string | null;
}

interface CustomPricing {
  id: number;
  recipeId: number;
  price: string;
  unit: string;
  notes: string | null;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
}

interface Customer {
  id: number;
  name: string;
}

interface CustomerPricingManagerProps {
  customer: Customer;
  recipes: Recipe[];
  customPricing: CustomPricing[];
}

export function CustomerPricingManager({
  customer,
  recipes,
  customPricing: initialPricing,
}: CustomerPricingManagerProps) {
  const [pricing, setPricing] = useState<Map<number, { price: string; notes: string }>>(
    new Map(initialPricing.map(p => [p.recipeId, { price: p.price, notes: p.notes || "" }]))
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState<number | null>(null);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function updatePricing(recipeId: number, price: string, notes: string) {
    setSaving(recipeId);

    try {
      const res = await fetch(`/api/wholesale/customers/${customer.id}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId,
          price: parseFloat(price),
          unit: "each",
          notes,
        }),
      });

      if (res.ok) {
        const newPricing = new Map(pricing);
        newPricing.set(recipeId, { price, notes });
        setPricing(newPricing);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update pricing");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(null);
    }
  }

  async function removePricing(recipeId: number) {
    try {
      const res = await fetch(`/api/wholesale/customers/${customer.id}/pricing?recipeId=${recipeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const newPricing = new Map(pricing);
        newPricing.delete(recipeId);
        setPricing(newPricing);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove pricing");
      }
    } catch (error) {
      alert("Network error");
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Custom Pricing</p>
            <p>Set special prices for {customer.name}. Leave blank to use default prices. Custom prices will be shown in their ordering portal.</p>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="space-y-2">
        {filteredRecipes.map((recipe) => {
          const customPrice = pricing.get(recipe.id);
          const hasCustomPrice = !!customPrice;
          
          return (
            <div
              key={recipe.id}
              className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                hasCustomPrice ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                <p className="text-sm text-gray-500">
                  {recipe.yieldQuantity} {recipe.yieldUnit}
                  {recipe.sellingPrice && (
                    <span className="ml-2">• Default: £{parseFloat(recipe.sellingPrice).toFixed(2)}</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-600">£</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice?.price || ""}
                    placeholder={recipe.sellingPrice || "0.00"}
                    onChange={(e) => {
                      const newPricing = new Map(pricing);
                      newPricing.set(recipe.id, {
                        price: e.target.value,
                        notes: customPrice?.notes || "",
                      });
                      setPricing(newPricing);
                    }}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                {customPrice && customPrice.price && (
                  <>
                    <button
                      onClick={() => updatePricing(recipe.id, customPrice.price, customPrice.notes)}
                      disabled={saving === recipe.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {saving === recipe.id ? "..." : "Save"}
                    </button>
                    {hasCustomPrice && (
                      <button
                        onClick={() => removePricing(recipe.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove custom price"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

