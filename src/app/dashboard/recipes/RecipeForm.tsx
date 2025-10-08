"use client";

import { useEffect, useMemo, useState } from "react";
import { computeIngredientUsageCost, computeRecipeCost, computeCostPerOutputUnit, Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";

type IngredientOption = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each";
  packPrice: number;
  densityGPerMl?: number | null;
};

type ItemRow = { id: string; ingredientId?: number; quantity?: number; unit?: Unit };

export function RecipeForm({
  ingredients,
  initial,
  onSubmit,
}: {
  ingredients: IngredientOption[];
  initial?: {
    name: string;
    yieldQuantity: number;
    yieldUnit: "g" | "ml" | "each";
    imageUrl?: string;
    items: Array<{ ingredientId: number; quantity: number; unit: Unit }>;
  };
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [yieldQuantity, setYieldQuantity] = useState<number>(initial?.yieldQuantity ?? 1);
  const [yieldUnit, setYieldUnit] = useState<"g" | "ml" | "each">(initial?.yieldUnit ?? "g");
  const [imageUrl, setImageUrl] = useState<string>(initial?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [items, setItems] = useState<ItemRow[]>(
    (initial?.items ?? []).map((it, idx) => ({ id: String(idx + 1), ingredientId: it.ingredientId, quantity: it.quantity, unit: it.unit }))
  );

  useEffect(() => {
    if (items.length === 0) setItems([{ id: "1" }]);
  }, [items.length]);

  const detailedItems = useMemo(() => {
    return items
      .filter((r) => r.ingredientId && r.quantity && r.unit)
      .map((r) => {
        const ing = ingredients.find((i) => i.id === r.ingredientId)!;
        return {
          quantity: r.quantity as number,
          unit: r.unit as Unit,
          ingredient: {
            packQuantity: ing.packQuantity,
            packUnit: ing.packUnit,
            packPrice: ing.packPrice,
            densityGPerMl: ing.densityGPerMl,
          },
        };
      });
  }, [items, ingredients]);

  const subtotal = useMemo(() => computeRecipeCost({ items: detailedItems }), [detailedItems]);
  const total = subtotal;
  const perOutput = useMemo(() => {
    const qty = yieldQuantity || 1;
    if (qty <= 0) return 0;
    return computeCostPerOutputUnit({ totalCost: total, yieldQuantity: qty });
  }, [total, yieldQuantity]);

  function handleAddRow() {
    setItems((prev) => [...prev, { id: String(prev.length ? Number(prev[prev.length - 1].id) + 1 : 1) }]);
  }
  function handleRemove(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    fd.set(
      "items",
      JSON.stringify(
        items
          .filter((r) => r.ingredientId && r.quantity && r.unit)
          .map((r) => ({ ingredientId: r.ingredientId!, quantity: r.quantity!, unit: r.unit! }))
      )
    );
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3" encType="multipart/form-data">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Recipe Name</label>
              <input 
                name="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
                placeholder="e.g., Classic Mac and Cheese"
                required 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Yield Quantity</label>
                <input 
                  type="number" 
                  step="any" 
                  name="yieldQuantity" 
                  value={yieldQuantity} 
                  onChange={(e) => setYieldQuantity(Number(e.target.value))} 
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
                  placeholder="4"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Yield Unit</label>
                <select 
                  name="yieldUnit" 
                  value={yieldUnit} 
                  onChange={(e) => setYieldUnit(e.target.value as any)} 
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                >
                  <option value="g">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="each">Each</option>
                  <option value="slices">Slices</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Recipe Image</label>
              {imageUrl ? (
                <div className="mb-3 relative">
                  <img src={imageUrl} alt="Recipe" className="h-32 w-32 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setUploadError("");
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Client-side file size check (10MB)
                    const maxSize = 10 * 1024 * 1024;
                    if (file.size > maxSize) {
                      setUploadError("File is too large. Maximum size is 10MB.");
                      return;
                    }
                    
                    setUploading(true);
                    setUploadError("");
                    
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const res = await fetch("/api/upload", { method: "POST", body: fd });
                      const data = await res.json();
                      
                      if (res.ok) {
                        setImageUrl(data.url);
                      } else {
                        setUploadError(data.error || "Upload failed");
                      }
                    } catch (error) {
                      setUploadError("Network error. Please try again.");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB (JPEG, PNG, GIF, WebP)</p>
              {uploadError && (
                <p className="text-sm text-red-600 mt-2">{uploadError}</p>
              )}
              <input type="hidden" name="imageUrl" value={imageUrl} />
              {uploading ? (
                <div className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Uploading…
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
            <button 
              type="button" 
              onClick={handleAddRow} 
              className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Ingredient
            </button>
          </div>
          <div className="space-y-3">
            {items.map((row) => (
              <div key={row.id} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-xl">
                <select
                  className="col-span-5 rounded-xl border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  value={row.ingredientId ?? ""}
                  onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, ingredientId: e.target.value ? Number(e.target.value) : undefined } : r)))}
                >
                  <option value="">Select ingredient</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="any"
                  className="col-span-3 rounded-xl border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  value={row.quantity ?? ""}
                  onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value ? Number(e.target.value) : undefined } : r)))}
                  placeholder="Amount"
                />
                <select
                  className="col-span-3 rounded-xl border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
                  value={row.unit ?? "g"}
                  onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, unit: e.target.value as Unit } : r)))}
                >
                  {[
                    "g","kg","mg","lb","oz","ml","l","pint","quart","gallon","tsp","tbsp","cup","floz","each","slices"
                  ].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => handleRemove(row.id)} 
                  className="col-span-1 bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <input type="hidden" name="items" value="[]" />

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Recipe
          </button>
        </div>
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="font-semibold text-lg text-gray-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Per {yieldUnit}</span>
              <span className="font-medium text-purple-600">{formatCurrency(perOutput)}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-800">
              💡 Costs are calculated automatically from your ingredient prices and densities. 
              Unit conversions happen seamlessly in the background.
            </p>
          </div>
          <div className="mt-4">
            <UnitConversionHelp />
          </div>
        </div>
      </aside>
    </form>
  );
}


