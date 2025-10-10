"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { Unit } from "@/generated/prisma";
import { computeIngredientUsageCost } from "@/lib/units";
import Link from "next/link";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  densityGPerMl?: number | null;
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

interface RecipeItem {
  id: string;
  ingredientId: number;
  quantity: string;
  unit: Unit;
  note?: string;
}

interface RecipeSection {
  id: string;
  title: string;
  description?: string;
  method?: string;
  items: RecipeItem[];
}

interface RecipePageInlineCompleteProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
    categoryId?: number | null;
    shelfLifeId?: number | null;
    storageId?: number | null;
    bakeTime?: number | null;
    bakeTemp?: number | null;
    sections: Array<{
      id: number;
      title: string;
      description?: string;
      method?: string;
      order: number;
      items: Array<{
        id: number;
        quantity: number;
        unit: string;
        note?: string;
        ingredient: {
          id: number;
          name: string;
          packQuantity: number;
          packUnit: string;
          packPrice: number;
          densityGPerMl?: number;
        };
      }>;
    }>;
    items: Array<{
      id: number;
      quantity: number;
      unit: string;
      note?: string;
      ingredient: {
        id: number;
        name: string;
        packQuantity: number;
        packUnit: string;
        packPrice: number;
        densityGPerMl?: number;
      };
    }>;
  };
  costBreakdown: {
    totalCost: number;
    costPerOutputUnit: number;
  };
  ingredients: Ingredient[];
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
  onSave: (data: FormData) => Promise<void>;
}

export function RecipePageInlineComplete({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSave,
}: RecipePageInlineCompleteProps) {
  // Lock/Unlock state
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Cooking mode state
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  // Editable recipe fields
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description || "");
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || "");
  const [method, setMethod] = useState(recipe.method || "");
  const [yieldQuantity, setYieldQuantity] = useState(recipe.yieldQuantity);
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [categoryId, setCategoryId] = useState(recipe.categoryId || "");
  const [shelfLifeId, setShelfLifeId] = useState(recipe.shelfLifeId || "");
  const [storageId, setStorageId] = useState(recipe.storageId || "");
  const [bakeTime, setBakeTime] = useState(recipe.bakeTime || "");
  const [bakeTemp, setBakeTemp] = useState(recipe.bakeTemp || "");
  
  // Sections vs simple items
  const [useSections, setUseSections] = useState(recipe.sections.length > 0);
  const [sections, setSections] = useState<RecipeSection[]>(
    recipe.sections.length > 0
      ? recipe.sections.map((s, idx) => ({
          id: `section-${idx}`,
          title: s.title,
          description: s.description || "",
          method: s.method || "",
          items: s.items.map((item, itemIdx) => ({
            id: `section-${idx}-item-${itemIdx}`,
            ingredientId: item.ingredient.id,
            quantity: item.quantity.toString(),
            unit: item.unit as Unit,
            note: item.note || "",
          })),
        }))
      : [{ id: "section-0", title: "Step 1", description: "", method: "", items: [] }]
  );
  
  const [items, setItems] = useState<RecipeItem[]>(
    recipe.items.map((item, idx) => ({
      id: `item-${idx}`,
      ingredientId: item.ingredient.id,
      quantity: item.quantity.toString(),
      unit: item.unit as Unit,
      note: item.note || "",
    }))
  );
  
  // Calculate scaled ingredients for view mode
  const scaleFactor = servings / recipe.yieldQuantity;
  
  const scaledIngredients = recipe.items.map(item => ({
    ...item,
    scaledQuantity: item.quantity * scaleFactor,
  }));

  const scaledSections = recipe.sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      scaledQuantity: item.quantity * scaleFactor,
    })),
  }));

  const toggleItem = (itemId: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Calculate edit mode cost
  const calculateEditCost = () => {
    let total = 0;
    const itemsToCalc = useSections 
      ? sections.flatMap(s => s.items)
      : items;

    itemsToCalc.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient && item.quantity) {
        const cost = computeIngredientUsageCost({
          usageQuantity: parseFloat(item.quantity) || 0,
          usageUnit: item.unit,
          ingredient: {
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit as any,
            packPrice: ingredient.packPrice,
            densityGPerMl: ingredient.densityGPerMl || undefined,
          }
        });
        total += cost;
      }
    });
    return total;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("recipeId", recipe.id.toString());
    formData.append("name", name);
    formData.append("description", description);
    formData.append("yieldQuantity", yieldQuantity.toString());
    formData.append("yieldUnit", yieldUnit);
    formData.append("method", method);
    formData.append("imageUrl", imageUrl);
    
    // Add recipe type information
    const recipeType = yieldUnit === "each" && yieldQuantity === 1 ? "single" : "batch";
    formData.append("recipeType", recipeType);
    formData.append("servings", yieldQuantity.toString());
    
    if (categoryId) formData.append("categoryId", categoryId.toString());
    if (shelfLifeId) formData.append("shelfLifeId", shelfLifeId.toString());
    if (storageId) formData.append("storageId", storageId.toString());
    if (bakeTime) formData.append("bakeTime", bakeTime.toString());
    if (bakeTemp) formData.append("bakeTemp", bakeTemp.toString());

    formData.append("useSections", useSections.toString());

    if (useSections) {
      formData.append("sections", JSON.stringify(sections));
    } else {
      formData.append("recipeItems", JSON.stringify(items));
    }

    await onSave(formData);
    setIsSaving(false);
    setIsLocked(true);
  };

  const addIngredient = () => {
    setItems([...items, {
      id: `item-${Date.now()}`,
      ingredientId: ingredients[0]?.id || 0,
      quantity: "0",
      unit: "g" as Unit,
      note: "",
    }]);
  };

  const removeIngredient = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addSection = () => {
    setSections([...sections, {
      id: `section-${Date.now()}`,
      title: `Step ${sections.length + 1}`,
      description: "",
      method: "",
      items: [],
    }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const addIngredientToSection = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: `${sectionId}-item-${Date.now()}`,
            ingredientId: ingredients[0]?.id || 0,
            quantity: "0",
            unit: "g" as Unit,
            note: "",
          }],
        };
      }
      return section;
    }));
  };

  const removeIngredientFromSection = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId),
        };
      }
      return section;
    }));
  };

  const allIngredients = recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
    : scaledIngredients;

  const editModeTotalCost = isLocked ? costBreakdown.totalCost : calculateEditCost();
  const editModeCostPerUnit = isLocked ? costBreakdown.costPerOutputUnit : (yieldQuantity > 0 ? editModeTotalCost / yieldQuantity : 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Lock/Unlock Toggle */}
      <div className="mb-8 flex items-center justify-between">
        <a 
          href="/dashboard/recipes" 
          className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recipes
        </a>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/recipes/${recipe.id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-sm font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Recipe
          </Link>
          
          {isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-sm font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Edit Recipe
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsLocked(true);
                  // Reset to original values
                  setName(recipe.name);
                  setDescription(recipe.description || "");
                  setImageUrl(recipe.imageUrl || "");
                  setMethod(recipe.method || "");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lock Indicator */}
      {!isLocked && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-blue-700 font-medium">
            <span className="font-semibold">Editing mode active</span> - Make your changes and click "Save Changes" when done
          </p>
        </div>
      )}

      {/* Recipe Title */}
      <div className="mb-8">
        {!isLocked ? (
          <div className="flex gap-6 items-start">
            {/* Title and Description */}
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add a description..."
                className="text-lg text-gray-600 mb-4 w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Yield:</span>
                  <input
                    type="number"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="each">servings</option>
                    <option value="g">grams</option>
                    <option value="ml">milliliters</option>
                  </select>
                </div>
                <span>Total Cost: {formatCurrency(editModeTotalCost)}</span>
                <span>Cost per {yieldUnit}: {formatCurrency(editModeCostPerUnit)}</span>
              </div>

              {/* Recipe Type Selector - Only in Edit Mode */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Recipe Type:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipeType"
                        value="single"
                        checked={yieldUnit === "each" && yieldQuantity === 1}
                        onChange={() => {
                          setYieldUnit("each");
                          setYieldQuantity(1);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Single Serving</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="recipeType"
                        value="batch"
                        checked={yieldUnit === "each" && yieldQuantity > 1}
                        onChange={() => {
                          setYieldUnit("each");
                          setYieldQuantity(4);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Batch Recipe</span>
                    </label>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {yieldUnit === "each" && yieldQuantity === 1 ? (
                    "Perfect for single portions - one sandwich, one serving, etc."
                  ) : yieldUnit === "each" && yieldQuantity > 1 ? (
                    `Makes ${yieldQuantity} servings - great for meal prep or feeding a group`
                  ) : (
                    "Custom yield quantity"
                  )}
                </div>
              </div>
            </div>

            {/* Small Image Preview in Edit Mode */}
            <div className="w-32 h-32 flex-shrink-0">
              {recipe.imageUrl || imageUrl ? (
                <img 
                  src={imageUrl || recipe.imageUrl} 
                  alt={recipe.name} 
                  className="w-full h-full object-cover rounded-xl shadow-md"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl shadow-md flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{name}</h1>
            {description && <p className="text-lg text-gray-600 mb-4">{description}</p>}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>Yield: {servings} {recipe.yieldUnit}</span>
              <span>Total Cost: {formatCurrency(editModeTotalCost * scaleFactor)}</span>
              <span>Cost per serving: {formatCurrency(editModeCostPerUnit * scaleFactor)}</span>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid xl:grid-cols-12 gap-8">
        {/* Recipe Image - Only in View Mode - 25% width */}
        {isLocked && (recipe.imageUrl || imageUrl) && (
          <div className="xl:col-span-3">
            <div className="sticky top-6">
              <img 
                src={imageUrl || recipe.imageUrl} 
                alt={recipe.name} 
                className="w-full h-auto object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        )}
        {/* Left Sidebar - Additional Details (only in edit mode) */}
        {!isLocked && (
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Life</label>
                  <select
                    value={shelfLifeId}
                    onChange={(e) => setShelfLifeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {shelfLifeOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                  <select
                    value={storageId}
                    onChange={(e) => setStorageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {storageOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bake Time (min)</label>
                    <input
                      type="number"
                      value={bakeTime}
                      onChange={(e) => setBakeTime(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bake Temp (°C)</label>
                    <input
                      type="number"
                      value={bakeTemp}
                      onChange={(e) => setBakeTemp(e.target.value)}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Ingredients and Instructions */}
        <div className={!isLocked ? "xl:col-span-7" : (recipe.imageUrl || imageUrl) ? "xl:col-span-9" : "xl:col-span-12"}>
          <div className="space-y-6">
            {/* Servings Control (only in locked mode) */}
            {isLocked && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Servings</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-xl font-medium text-gray-900 min-w-[3rem] text-center">{servings}</span>
                    <button 
                      onClick={() => setServings(servings + 1)}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
              {/* Ingredients */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                  {isLocked && (
                    <span className="text-sm text-gray-500">
                      {checkedItems.size} of {allIngredients.length} checked
                    </span>
                  )}
                  {!isLocked && !useSections && (
                    <button
                      onClick={addIngredient}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      + Add
                    </button>
                  )}
                  {!isLocked && useSections && (
                    <button
                      onClick={addSection}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      + Add Step
                    </button>
                  )}
                </div>

                {/* Sections Toggle - Only in Edit Mode */}
                {!isLocked && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSections}
                        onChange={(e) => {
                          const newUseSections = e.target.checked;
                          setUseSections(newUseSections);
                          
                          // When enabling sections, move existing items to first section
                          if (newUseSections && items.length > 0) {
                            setSections([{
                              id: "section-0",
                              title: "Step 1",
                              description: "",
                              method: "",
                              items: [...items], // Preserve existing ingredients
                            }]);
                          }
                          
                          // When disabling sections, move first section's items back to simple list
                          if (!newUseSections && sections.length > 0 && sections[0].items.length > 0) {
                            setItems([...sections[0].items]);
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Use Sections (Multi-Step Recipe)</div>
                        <div className="text-xs text-gray-600">Organize ingredients and instructions into separate steps</div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Edit Mode - Sections */}
                {!isLocked && useSections && (
                  <div className="space-y-6">
                    {sections.map((section, sectionIdx) => (
                      <div key={section.id} className="bg-gray-50 rounded-xl border-2 border-blue-200 p-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-lg"
                              placeholder="Step title"
                            />
                            <textarea
                              value={section.method}
                              onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, method: e.target.value } : s))}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Instructions for this step..."
                            />
                          </div>
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Ingredients for this step</h4>
                            <button
                              onClick={() => addIngredientToSection(section.id)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                              + Add Ingredient
                            </button>
                          </div>
                          {section.items.map((item) => {
                            const ingredient = ingredients.find(i => i.id === item.ingredientId);
                            const cost = ingredient ? computeIngredientUsageCost({
                              usageQuantity: parseFloat(item.quantity) || 0,
                              usageUnit: item.unit,
                              ingredient: {
                                packQuantity: ingredient.packQuantity,
                                packUnit: ingredient.packUnit as any,
                                packPrice: ingredient.packPrice,
                                densityGPerMl: ingredient.densityGPerMl || undefined,
                              }
                            }) : 0;
                            
                            return (
                              <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg border border-gray-200">
                                <select
                                  value={item.ingredientId}
                                  onChange={(e) => setSections(sections.map(s => {
                                    if (s.id === section.id) {
                                      return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, ingredientId: parseInt(e.target.value) } : i) };
                                    }
                                    return s;
                                  }))}
                                  className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => setSections(sections.map(s => {
                                    if (s.id === section.id) {
                                      return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i) };
                                    }
                                    return s;
                                  }))}
                                  className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="Qty"
                                />
                                <select
                                  value={item.unit}
                                  onChange={(e) => setSections(sections.map(s => {
                                    if (s.id === section.id) {
                                      return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, unit: e.target.value as Unit } : i) };
                                    }
                                    return s;
                                  }))}
                                  className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="each">each</option>
                                </select>
                                <div className="col-span-2 px-3 py-2 text-sm text-gray-600 flex items-center">
                                  {formatCurrency(cost)}
                                </div>
                                <button
                                  onClick={() => removeIngredientFromSection(section.id, item.id)}
                                  className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Mode - Simple Ingredients */}
                {!isLocked && !useSections && (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const ingredient = ingredients.find(i => i.id === item.ingredientId);
                      const cost = ingredient ? computeIngredientUsageCost({
                        usageQuantity: parseFloat(item.quantity) || 0,
                        usageUnit: item.unit,
                        ingredient: {
                          packQuantity: ingredient.packQuantity,
                          packUnit: ingredient.packUnit as any,
                          packPrice: ingredient.packPrice,
                          densityGPerMl: ingredient.densityGPerMl || undefined,
                        }
                      }) : 0;
                      
                      return (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                          <select
                            value={item.ingredientId}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, ingredientId: parseInt(e.target.value) } : i))}
                            className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i))}
                            className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Qty"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => setItems(items.map(i => i.id === item.id ? { ...i, unit: e.target.value as Unit } : i))}
                            className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="each">each</option>
                          </select>
                          <div className="col-span-2 px-3 py-2 text-sm text-gray-600 flex items-center">
                            {formatCurrency(cost)}
                          </div>
                          <button
                            onClick={() => removeIngredient(item.id)}
                            className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* View Mode - Ingredients */}
                {isLocked && (
                  <div className="space-y-3">
                    {recipe.sections.length > 0 ? (
                      scaledSections.map((section) => (
                        <div key={section.id} className="space-y-3">
                          {section.items.length > 0 && (
                            <>
                              <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                                {section.title}
                              </h3>
                              {section.items.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    checkedItems.has(item.id) 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={checkedItems.has(item.id)}
                                    onChange={() => toggleItem(item.id)}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                  />
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-900">
                                      {item.scaledQuantity.toFixed(1)} {item.unit}
                                    </span>
                                    <span className="text-gray-600 ml-2">{item.ingredient.name}</span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatCurrency((item.ingredient.packPrice / item.ingredient.packQuantity) * item.scaledQuantity)}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      scaledIngredients.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            checkedItems.has(item.id) 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={checkedItems.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">
                              {item.scaledQuantity.toFixed(1)} {item.unit}
                            </span>
                            <span className="text-gray-600 ml-2">{item.ingredient.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatCurrency((item.ingredient.packPrice / item.ingredient.packQuantity) * item.scaledQuantity)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
                {!isLocked && !useSections ? (
                  <textarea
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    rows={8}
                    placeholder="Write your cooking instructions here..."
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : !isLocked && useSections ? (
                  <div className="text-sm text-gray-500 italic text-center py-6 bg-blue-50 rounded-lg">
                    Instructions are managed within each section above
                  </div>
                ) : (
                  recipe.sections.length > 0 ? (
                    <div className="space-y-6">
                      {scaledSections.map((section) => (
                        <div key={section.id}>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">{section.title}</h3>
                          {section.method && (
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {section.method}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : recipe.method ? (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {recipe.method}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">No instructions provided</p>
                  )
                )}
              </div>
            </div>
          </div>

        {/* Right Sidebar - Cost Breakdown (only in edit mode) */}
        {!isLocked && (
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                  <span className="text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-emerald-700">{formatCurrency(editModeTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Cost per {yieldUnit}:</span>
                  <span className="text-xl font-semibold text-emerald-600">{formatCurrency(editModeCostPerUnit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

