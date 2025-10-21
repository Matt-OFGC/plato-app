"use client";

import { formatCurrency } from "@/lib/currency";
import { useState } from "react";

interface RecipePrintViewProps {
  recipe: {
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    bakeTime?: number;
    bakeTemp?: number;
    storage?: string;
    shelfLife?: string;
    category?: string;
    method?: string;
    currentPrice?: number;
    targetMargin?: number;
    sections?: Array<{
      title: string;
      description?: string;
      method?: string;
      items: Array<{
        quantity: number;
        unit: string;
        ingredient: {
          name: string;
        };
        cost: number;
      }>;
    }>;
    items?: Array<{
      quantity: number;
      unit: string;
      ingredient: {
        name: string;
      };
      cost: number;
    }>;
    totalCost: number;
    costPerUnit: number;
  };
  currency?: string;
}

export function RecipePrintView({ recipe, currency = "GBP" }: RecipePrintViewProps) {
  const [printMode, setPrintMode] = useState<"kitchen" | "cost">("kitchen");

  const handlePrint = () => {
    // Ensure print content is visible before print
    try {
      const root = document.querySelector('.print-content') as HTMLElement | null;
      if (root) root.style.display = 'block';
    } catch {}
    window.print();
  };

  const actualMargin = recipe.currentPrice && recipe.totalCost > 0
    ? ((recipe.currentPrice - recipe.totalCost) / recipe.currentPrice) * 100
    : null;

  return (
    <div>
      {/* Print Mode Selector (hidden when printing) */}
      <div className="no-print mb-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setPrintMode("kitchen")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                printMode === "kitchen"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Kitchen Card
            </button>
            <button
              onClick={() => setPrintMode("cost")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                printMode === "cost"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cost Sheet
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Print Content */}
      <div className="print-content">
        {printMode === "kitchen" ? (
          <KitchenCard recipe={recipe} />
        ) : (
          <CostSheet recipe={recipe} currency={currency} actualMargin={actualMargin} />
        )}
      </div>
    </div>
  );
}

// Kitchen Card Format - Large text, ingredient list, method
function KitchenCard({ recipe }: { recipe: RecipePrintViewProps["recipe"] }) {
  return (
    <div className="bg-white p-8 rounded-xl border-2 border-gray-300 kitchen-card">
      {/* Header */}
      <div className="border-b-4 border-gray-900 pb-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.name.toUpperCase()}</h1>
        <div className="flex items-center gap-4 text-lg text-gray-700">
          <span>
            <strong>Yield:</strong> {recipe.yieldQuantity} {recipe.yieldUnit}
          </span>
          {recipe.category && (
            <span className="px-3 py-1 bg-gray-200 rounded-lg">{recipe.category}</span>
          )}
        </div>
      </div>

      {/* Baking Info */}
      {(recipe.bakeTime || recipe.bakeTemp) && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
          {recipe.bakeTemp && (
            <div>
              <p className="text-sm font-semibold text-amber-900">TEMPERATURE:</p>
              <p className="text-3xl font-bold text-amber-700">{recipe.bakeTemp}°C</p>
            </div>
          )}
          {recipe.bakeTime && (
            <div>
              <p className="text-sm font-semibold text-amber-900">TIME:</p>
              <p className="text-3xl font-bold text-amber-700">{recipe.bakeTime} mins</p>
            </div>
          )}
        </div>
      )}

      {/* Ingredients by Section */}
      {recipe.sections && recipe.sections.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            INGREDIENTS
          </h2>
          {recipe.sections.map((section, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="text-xl font-bold text-emerald-700 mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-baseline gap-2 text-lg">
                    <input type="checkbox" className="w-5 h-5 mt-1" />
                    <span className="font-bold min-w-[80px]">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="flex-1">{item.ingredient.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            INGREDIENTS
          </h2>
          <div className="space-y-2">
            {recipe.items?.map((item, idx) => (
              <div key={idx} className="flex items-baseline gap-2 text-lg">
                <input type="checkbox" className="w-5 h-5 mt-1" />
                <span className="font-bold min-w-[80px]">
                  {item.quantity} {item.unit}
                </span>
                <span className="flex-1">{item.ingredient.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method */}
      {(recipe.method || (recipe.sections && recipe.sections.some(s => s.method))) && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            METHOD
          </h2>
          {recipe.sections && recipe.sections.length > 0 ? (
            recipe.sections.map((section, idx) => (
              section.method && (
                <div key={idx} className="mb-4">
                  <h3 className="text-xl font-bold text-emerald-700 mb-2">{section.title}</h3>
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {section.method}
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="whitespace-pre-wrap text-base leading-relaxed">{recipe.method}</div>
          )}
        </div>
      )}

      {/* Storage & Shelf Life */}
      {(recipe.storage || recipe.shelfLife) && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          {recipe.storage && (
            <div>
              <p className="text-sm font-semibold text-blue-900">STORAGE:</p>
              <p className="text-base font-medium text-blue-700">{recipe.storage}</p>
            </div>
          )}
          {recipe.shelfLife && (
            <div>
              <p className="text-sm font-semibold text-blue-900">SHELF LIFE:</p>
              <p className="text-base font-medium text-blue-700">{recipe.shelfLife}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Cost Sheet Format - Detailed costing information
function CostSheet({
  recipe,
  currency,
  actualMargin,
}: {
  recipe: RecipePrintViewProps["recipe"];
  currency: string;
  actualMargin: number | null;
}) {
  const suggestedPrice =
    recipe.targetMargin && recipe.totalCost > 0
      ? recipe.totalCost / (1 - recipe.targetMargin / 100)
      : null;

  return (
    <div className="bg-white p-8 rounded-xl border-2 border-gray-300 cost-sheet">
      {/* Header */}
      <div className="border-b-4 border-gray-900 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.name} - COSTING</h1>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Yield: {recipe.yieldQuantity} {recipe.yieldUnit}
          </span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Ingredient Costs by Section */}
      {recipe.sections && recipe.sections.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">INGREDIENT BREAKDOWN</h2>
          {recipe.sections.map((section, idx) => {
            const sectionTotal = section.items.reduce((sum, item) => sum + item.cost, 0);
            return (
              <div key={idx} className="mb-6">
                <h3 className="text-lg font-bold text-emerald-700 mb-2 flex items-center justify-between">
                  <span>{section.title}</span>
                  <span>{formatCurrency(sectionTotal, currency)}</span>
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-2">Ingredient</th>
                      <th className="text-right py-2 w-24">Quantity</th>
                      <th className="text-right py-2 w-24">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, itemIdx) => (
                      <tr key={itemIdx} className="border-b border-gray-200">
                        <td className="py-2">{item.ingredient.name}</td>
                        <td className="text-right py-2">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(item.cost, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">INGREDIENT BREAKDOWN</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2">Ingredient</th>
                <th className="text-right py-2 w-24">Quantity</th>
                <th className="text-right py-2 w-24">Cost</th>
              </tr>
            </thead>
            <tbody>
              {recipe.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2">{item.ingredient.name}</td>
                  <td className="text-right py-2">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="text-right py-2 font-semibold">
                    {formatCurrency(item.cost, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cost Summary */}
      <div className="border-t-4 border-gray-900 pt-6 space-y-3">
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total Cost:</span>
          <span className="font-bold text-2xl">{formatCurrency(recipe.totalCost, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">
            Cost per {recipe.yieldUnit}:
          </span>
          <span className="font-bold text-xl text-emerald-600">
            {formatCurrency(recipe.costPerUnit, currency)}
          </span>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-3">PRICING</h2>
        <div className="space-y-2">
          {recipe.currentPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Selling Price:</span>
              <span className="font-bold">{formatCurrency(recipe.currentPrice, currency)}</span>
            </div>
          )}
          {suggestedPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Suggested Price ({recipe.targetMargin}% margin):
              </span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(suggestedPrice, currency)}
              </span>
            </div>
          )}
          {actualMargin !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Margin:</span>
              <span
                className={`font-bold ${
                  actualMargin >= (recipe.targetMargin || 65)
                    ? "text-emerald-600"
                    : actualMargin >= (recipe.targetMargin || 55)
                    ? "text-amber-600"
                    : "text-red-600"
                }`}
              >
                {actualMargin.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
        Generated by Plato Kitchen Management • {new Date().toLocaleDateString()} •{" "}
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
