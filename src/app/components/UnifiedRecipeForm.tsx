"use client";

import { useState, useEffect, useMemo } from "react";
import { Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { SearchableSelect } from "@/components/SearchableSelect";

interface IngredientOption {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each";
  packPrice: number;
  densityGPerMl?: number | null;
}

interface RecipeOption {
  id: number;
  name: string;
  yieldQuantity: number;
  yieldUnit: "g" | "ml" | "each";
  items: Array<{ ingredientId: number; quantity: number; unit: Unit }>;
}

interface Category {
  id: number;
  name: string;
}

interface ShelfLifeOption {
  id: number;
  name: string;
}

interface StorageOption {
  id: number;
  name: string;
}

interface UnifiedRecipeFormProps {
  ingredients: IngredientOption[];
  allRecipes: RecipeOption[];
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
  onSubmit: (formData: FormData) => void | Promise<void>;
  initialData?: {
    name?: string;
    description?: string;
    yieldQuantity?: number;
    yieldUnit?: "g" | "ml" | "each";
    imageUrl?: string;
    method?: string;
    categoryId?: number;
    shelfLifeId?: number;
    storageId?: number;
    sellingPrice?: number;
    portionsPerBatch?: number;
    items?: Array<{ ingredientId: number; quantity: number; unit: Unit }>;
  };
}

const ALLERGEN_OPTIONS = [
  "Celery",
  "Cereals containing gluten",
  "Crustaceans",
  "Eggs",
  "Fish",
  "Lupin",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame seeds",
  "Soya",
  "Sulphur dioxide/sulphites"
];

const NUT_TYPES = [
  "Almonds",
  "Brazil nuts",
  "Cashews",
  "Hazelnuts",
  "Macadamia nuts",
  "Pecans",
  "Pistachios",
  "Walnuts",
  "Mixed nuts"
];

type ItemRow = { id: string; ingredientId?: number; quantity?: number; unit?: Unit };

export function UnifiedRecipeForm({
  ingredients,
  allRecipes,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSubmit,
  initialData
}: UnifiedRecipeFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    yieldQuantity: initialData?.yieldQuantity || 1,
    yieldUnit: initialData?.yieldUnit || "g" as "g" | "ml" | "each",
    imageUrl: initialData?.imageUrl || "",
    method: initialData?.method || "",
    categoryId: initialData?.categoryId || "",
    shelfLifeId: initialData?.shelfLifeId || "",
    storageId: initialData?.storageId || "",
    sellingPrice: initialData?.sellingPrice || "",
    portionsPerBatch: initialData?.portionsPerBatch || "",
  });

  const [items, setItems] = useState<ItemRow[]>(
    (initialData?.items ?? []).map((it, idx) => ({ 
      id: String(idx + 1), 
      ingredientId: it.ingredientId, 
      quantity: it.quantity, 
      unit: it.unit 
    }))
  );

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedNutTypes, setSelectedNutTypes] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) setItems([{ id: "1" }]);
  }, [items.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : "") : value
    }));
  };

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    if (checked) {
      setSelectedAllergens(prev => [...prev, allergen]);
    } else {
      setSelectedAllergens(prev => prev.filter(a => a !== allergen));
      // If "Nuts" is unchecked, also clear nut types
      if (allergen === "Nuts") {
        setSelectedNutTypes([]);
      }
    }
  };

  const handleNutTypeChange = (nutType: string, checked: boolean) => {
    if (checked) {
      setSelectedNutTypes(prev => [...prev, nutType]);
    } else {
      setSelectedNutTypes(prev => prev.filter(n => n !== nutType));
    }
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, { id: String(prev.length ? Number(prev[prev.length - 1].id) + 1 : 1) }]);
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine allergens and nut types
    const allAllergens = [...selectedAllergens];
    if (selectedNutTypes.length > 0) {
      // Replace "Nuts" with specific nut types
      const allergensWithoutNuts = allAllergens.filter(a => a !== "Nuts");
      allAllergens.splice(0, allAllergens.length, ...allergensWithoutNuts, ...selectedNutTypes);
    }

    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("description", formData.description);
    formDataObj.append("yieldQuantity", formData.yieldQuantity.toString());
    formDataObj.append("yieldUnit", formData.yieldUnit);
    formDataObj.append("imageUrl", formData.imageUrl);
    formDataObj.append("method", formData.method);
    formDataObj.append("categoryId", formData.categoryId.toString());
    formDataObj.append("shelfLifeId", formData.shelfLifeId.toString());
    formDataObj.append("storageId", formData.storageId.toString());
    formDataObj.append("sellingPrice", formData.sellingPrice.toString());
    formDataObj.append("portionsPerBatch", formData.portionsPerBatch.toString());
    formDataObj.append("allergens", JSON.stringify(allAllergens));
    formDataObj.append("items", JSON.stringify(
      items
        .filter((r) => r.ingredientId && r.quantity && r.unit)
        .map((r) => ({ ingredientId: r.ingredientId!, quantity: r.quantity!, unit: r.unit! }))
    ));

    onSubmit(formDataObj);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Chocolate Chip Cookies"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the recipe"
            />
          </div>

          <div>
            <label htmlFor="yieldQuantity" className="block text-sm font-medium text-gray-700 mb-2">
              Yield Quantity *
            </label>
            <input
              type="number"
              id="yieldQuantity"
              name="yieldQuantity"
              value={formData.yieldQuantity}
              onChange={handleInputChange}
              required
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="yieldUnit" className="block text-sm font-medium text-gray-700 mb-2">
              Yield Unit *
            </label>
            <select
              id="yieldUnit"
              name="yieldUnit"
              value={formData.yieldUnit}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="g">Grams (g)</option>
              <option value="ml">Milliliters (ml)</option>
              <option value="each">Each</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Image</h3>
        {formData.imageUrl ? (
          <div className="mb-4 relative inline-block">
            <img src={formData.imageUrl} alt="Recipe" className="h-32 w-32 object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, imageUrl: "" }));
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
                  setFormData(prev => ({ ...prev, imageUrl: data.url }));
                } else {
                  setUploadError(data.error || "Upload failed");
                }
              } catch (error) {
                setUploadError("Network error. Please try again.");
              } finally {
                setUploading(false);
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {uploading && (
          <p className="mt-2 text-sm text-blue-600">Uploading...</p>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
        
        <div className="space-y-4">
          {items.map((row, index) => (
            <div key={row.id} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="col-span-5">
                <SearchableSelect
                  options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
                  value={row.ingredientId}
                  onChange={(value) => {
                    const selectedIngredient = value ? ingredients.find(i => i.id === value) : null;
                    const defaultUnit = selectedIngredient?.packUnit || "g";
                    setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, ingredientId: value, unit: r.unit || defaultUnit } : r)));
                  }}
                  placeholder="Select ingredient..."
                />
              </div>
              <input
                type="number"
                step="any"
                className="col-span-3 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={row.quantity ?? ""}
                onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, quantity: e.target.value ? Number(e.target.value) : undefined } : r)))}
                placeholder="Amount"
              />
              <select
                className="col-span-3 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={row.unit ?? "g"}
                onChange={(e) => setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, unit: e.target.value as Unit } : r)))}
              >
                {["g","kg","mg","lb","oz","ml","l","tsp","tbsp","cup","floz","each","slices"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button 
                type="button"
                onClick={() => handleRemove(row.id)}
                className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700 p-2 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Ingredient
        </button>
      </div>

      {/* Allergens */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allergens</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALLERGEN_OPTIONS.map((allergen) => (
            <label key={allergen} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAllergens.includes(allergen)}
                onChange={(e) => handleAllergenChange(allergen, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{allergen}</span>
            </label>
          ))}
        </div>

        {/* Specific Nut Types */}
        {selectedAllergens.includes("Nuts") && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Specific Nut Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {NUT_TYPES.map((nutType) => (
                <label key={nutType} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNutTypes.includes(nutType)}
                    onChange={(e) => handleNutTypeChange(nutType, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{nutType}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recipe Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="shelfLifeId" className="block text-sm font-medium text-gray-700 mb-2">
              Shelf Life
            </label>
            <select
              id="shelfLifeId"
              name="shelfLifeId"
              value={formData.shelfLifeId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select shelf life</option>
              {shelfLifeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="storageId" className="block text-sm font-medium text-gray-700 mb-2">
              Storage
            </label>
            <select
              id="storageId"
              name="storageId"
              value={formData.storageId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select storage</option>
              {storageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price
            </label>
            <input
              type="number"
              id="sellingPrice"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="portionsPerBatch" className="block text-sm font-medium text-gray-700 mb-2">
              Portions per Batch
            </label>
            <input
              type="number"
              id="portionsPerBatch"
              name="portionsPerBatch"
              value={formData.portionsPerBatch}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
        <textarea
          id="method"
          name="method"
          value={formData.method}
          onChange={handleInputChange}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter step-by-step instructions for your recipe..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save Recipe
        </button>
      </div>
    </form>
  );
}
