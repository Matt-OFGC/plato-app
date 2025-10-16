"use client";

import { useEffect, useMemo, useState } from "react";
import { computeIngredientUsageCost, computeRecipeCost, computeCostPerOutputUnit, Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";
import { SearchableSelect } from "@/components/SearchableSelect";

type IngredientOption = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each";
  originalUnit?: Unit | null;
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
  
  // Wholesale product state
  const [isWholesaleProduct, setIsWholesaleProduct] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState("");

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
    <div className="modal-fullscreen-mobile">
      <form onSubmit={handleSubmit} className="flex flex-col h-full" encType="multipart/form-data">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-responsive-h3 text-gray-900">Recipe Details</h2>
              <p className="text-responsive-body text-gray-600 mt-1">Create and edit your recipe</p>
            </div>
            <button
              type="submit"
              className="btn-responsive-primary"
            >
              Save Recipe
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="card-responsive">
                <h3 className="text-responsive-h3 text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Recipe Name</label>
                    <input 
                      name="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="input-responsive w-full focus:border-purple-500 focus:ring-2 focus:ring-purple-200" 
                      placeholder="e.g., Classic Mac and Cheese"
                      required 
                    />
                  </div>
            
            {/* Wholesale Product Section */}
            <div className="border border-green-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-green-50">
                <input
                  type="checkbox"
                  name="isWholesaleProduct"
                  id="isWholesaleProduct"
                  checked={isWholesaleProduct}
                  onChange={(e) => setIsWholesaleProduct(e.target.checked)}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isWholesaleProduct" className="flex items-center gap-2 cursor-pointer flex-1">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Add to Wholesale Product Catalogue</span>
                </label>
              </div>
              
              {isWholesaleProduct && (
                <div className="p-4 bg-white border-t border-green-200">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Wholesale Price Per Unit (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="wholesalePrice"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Price per slice/unit"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Per unit pricing:</strong> If this recipe makes 24 slices, enter the price for <strong>one slice</strong>. 
                      Customers will order by number of slices, and the system will calculate batches needed for production.
                    </p>
                  </div>
                </div>
              )}
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

              <div className="card-responsive">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-responsive-h3 text-gray-900">Ingredients</h3>
                  <button 
                    type="button" 
                    onClick={handleAddRow} 
                    className="btn-responsive-secondary flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Ingredient
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-xl">
                      <div className="sm:col-span-5">
                        <SearchableSelect
                          options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
                          value={row.ingredientId}
                          onChange={(value) => {
                            const selectedIngredient = value ? ingredients.find(i => i.id === value) : null;
                            const defaultUnit = selectedIngredient?.originalUnit || "g";
                            setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, ingredientId: value, unit: r.unit || defaultUnit } : r)));
                          }}
                          placeholder="Select ingredient..."
                        />
                      </div>
                      <input
                        type="number"
                        step="any"
                        className="sm:col-span-3 input-responsive focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        value={row.quantity ?? ""}
                        onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value ? Number(e.target.value) : undefined } : r)))}
                        placeholder="Amount"
                      />
                      <select
                        className="sm:col-span-3 input-responsive focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
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
                        className="sm:col-span-1 bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center touch-target"
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
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="card-responsive sticky top-8">
              <h3 className="text-responsive-h3 text-gray-900 mb-4">Cost Analysis</h3>
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
        </div>
        </div>
      </form>
    </div>
  );
}


