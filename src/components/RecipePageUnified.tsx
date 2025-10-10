"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { RecipeExportButtons } from "./RecipeExportButtons";
import { Unit } from "@/generated/prisma";
import { computeIngredientUsageCost } from "@/lib/units";

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

interface RecipePageUnifiedProps {
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

export function RecipePageUnified({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSave,
}: RecipePageUnifiedProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  // Edit mode state
  const [editName, setEditName] = useState(recipe.name);
  const [editDescription, setEditDescription] = useState(recipe.description || "");
  const [editYieldQuantity, setEditYieldQuantity] = useState(recipe.yieldQuantity);
  const [editYieldUnit, setEditYieldUnit] = useState(recipe.yieldUnit);
  const [editImageUrl, setEditImageUrl] = useState(recipe.imageUrl || "");
  const [editMethod, setEditMethod] = useState(recipe.method || "");
  const [editCategoryId, setEditCategoryId] = useState(recipe.categoryId || "");
  const [editShelfLifeId, setEditShelfLifeId] = useState(recipe.shelfLifeId || "");
  const [editStorageId, setEditStorageId] = useState(recipe.storageId || "");
  const [editBakeTime, setEditBakeTime] = useState(recipe.bakeTime || "");
  const [editBakeTemp, setEditBakeTemp] = useState(recipe.bakeTemp || "");
  
  // Ingredient editing
  const [editItems, setEditItems] = useState(
    recipe.items.map((item, idx) => ({
      id: `item-${idx}`,
      ingredientId: item.ingredient.id,
      quantity: item.quantity.toString(),
      unit: item.unit as Unit,
      note: item.note || "",
    }))
  );

  const [editSections, setEditSections] = useState(
    recipe.sections.map((section, idx) => ({
      id: `section-${idx}`,
      title: section.title,
      description: section.description || "",
      method: section.method || "",
      items: section.items.map((item, itemIdx) => ({
        id: `section-${idx}-item-${itemIdx}`,
        ingredientId: item.ingredient.id,
        quantity: item.quantity.toString(),
        unit: item.unit as Unit,
        note: item.note || "",
      })),
    }))
  );

  const [useSections, setUseSections] = useState(recipe.sections.length > 0);

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

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("recipeId", recipe.id.toString());
    formData.append("name", editName);
    formData.append("description", editDescription);
    formData.append("yieldQuantity", editYieldQuantity.toString());
    formData.append("yieldUnit", editYieldUnit);
    formData.append("method", editMethod);
    formData.append("imageUrl", editImageUrl);
    
    if (editCategoryId) formData.append("categoryId", editCategoryId.toString());
    if (editShelfLifeId) formData.append("shelfLifeId", editShelfLifeId.toString());
    if (editStorageId) formData.append("storageId", editStorageId.toString());
    if (editBakeTime) formData.append("bakeTime", editBakeTime.toString());
    if (editBakeTemp) formData.append("bakeTemp", editBakeTemp.toString());

    formData.append("useSections", useSections.toString());

    if (useSections) {
      formData.append("sections", JSON.stringify(editSections));
    } else {
      formData.append("recipeItems", JSON.stringify(editItems));
    }

    await onSave(formData);
    setIsEditing(false);
  };

  const addIngredient = () => {
    setEditItems([...editItems, {
      id: `item-${Date.now()}`,
      ingredientId: ingredients[0]?.id || 0,
      quantity: "0",
      unit: "g" as Unit,
      note: "",
    }]);
  };

  const removeIngredient = (id: string) => {
    setEditItems(editItems.filter(item => item.id !== id));
  };

  const addSection = () => {
    setEditSections([...editSections, {
      id: `section-${Date.now()}`,
      title: `Step ${editSections.length + 1}`,
      description: "",
      method: "",
      items: [],
    }]);
  };

  const removeSection = (id: string) => {
    setEditSections(editSections.filter(section => section.id !== id));
  };

  const addIngredientToSection = (sectionId: string) => {
    setEditSections(editSections.map(section => {
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
    setEditSections(editSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId),
        };
      }
      return section;
    }));
  };

  // Calculate total cost for edit mode
  const calculateEditModeCost = () => {
    let total = 0;
    const itemsToCalc = useSections 
      ? editSections.flatMap(s => s.items)
      : editItems;

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

  const allIngredients = recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
    : scaledIngredients;

  if (isEditing) {
    const editModeTotalCost = calculateEditModeCost();
    const editModeCostPerUnit = editYieldQuantity > 0 ? editModeTotalCost / editYieldQuantity : 0;

    return (
      <div className="max-w-7xl mx-auto">
        {/* Edit Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard/recipes" 
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Recipes
            </a>
            <h1 className="text-3xl font-bold text-gray-900">Editing Mode</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
          </div>
        </div>

        {/* Edit Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Recipe Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name & Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                  placeholder="Enter recipe name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Brief description of the recipe"
                />
              </div>
            </div>

            {/* Yield & Image */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yield Quantity</label>
                  <input
                    type="number"
                    value={editYieldQuantity}
                    onChange={(e) => setEditYieldQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yield Unit</label>
                  <select
                    value={editYieldUnit}
                    onChange={(e) => setEditYieldUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="each">servings (each)</option>
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Sections Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSections}
                  onChange={(e) => setUseSections(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Use Sections (Multi-Step Recipe)</div>
                  <div className="text-sm text-gray-500">Organize ingredients and instructions into separate steps</div>
                </div>
              </label>
            </div>

            {/* Ingredients Section */}
            {!useSections && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                  <button
                    onClick={addIngredient}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    + Add Ingredient
                  </button>
                </div>
                <div className="space-y-3">
                  {editItems.map((item) => {
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
                      <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                        <select
                          value={item.ingredientId}
                          onChange={(e) => setEditItems(editItems.map(i => i.id === item.id ? { ...i, ingredientId: parseInt(e.target.value) } : i))}
                          className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => setEditItems(editItems.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i))}
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Qty"
                        />
                        <select
                          value={item.unit}
                          onChange={(e) => setEditItems(editItems.map(i => i.id === item.id ? { ...i, unit: e.target.value as Unit } : i))}
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sections */}
            {useSections && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Recipe Steps</h2>
                  <button
                    onClick={addSection}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    + Add Step
                  </button>
                </div>
                {editSections.map((section, sectionIdx) => (
                  <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => setEditSections(editSections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-semibold"
                          placeholder="Step title"
                        />
                        <textarea
                          value={section.method}
                          onChange={(e) => setEditSections(editSections.map(s => s.id === section.id ? { ...s, method: e.target.value } : s))}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Instructions for this step..."
                        />
                      </div>
                      <button
                        onClick={() => removeSection(section.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Ingredients for this step</h4>
                        <button
                          onClick={() => addIngredientToSection(section.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          + Add
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
                          <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-2 bg-gray-50 rounded-lg">
                            <select
                              value={item.ingredientId}
                              onChange={(e) => setEditSections(editSections.map(s => {
                                if (s.id === section.id) {
                                  return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, ingredientId: parseInt(e.target.value) } : i) };
                                }
                                return s;
                              }))}
                              className="col-span-5 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                              {ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => setEditSections(editSections.map(s => {
                                if (s.id === section.id) {
                                  return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, quantity: e.target.value } : i) };
                                }
                                return s;
                              }))}
                              className="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              placeholder="Qty"
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => setEditSections(editSections.map(s => {
                                if (s.id === section.id) {
                                  return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, unit: e.target.value as Unit } : i) };
                                }
                                return s;
                              }))}
                              className="col-span-2 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                              <option value="g">g</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="l">l</option>
                              <option value="each">each</option>
                            </select>
                            <div className="col-span-2 px-2 py-1.5 text-xs text-gray-600 flex items-center">
                              {formatCurrency(cost)}
                            </div>
                            <button
                              onClick={() => removeIngredientFromSection(section.id, item.id)}
                              className="col-span-1 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Method (only if not using sections) */}
            {!useSections && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
                <textarea
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Write your cooking instructions here..."
                />
              </div>
            )}
          </div>

          {/* Right Sidebar - Cost & Additional Details */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                  <span className="text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-emerald-700">{formatCurrency(editModeTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Cost per {editYieldUnit}:</span>
                  <span className="text-xl font-semibold text-emerald-600">{formatCurrency(editModeCostPerUnit)}</span>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    value={editShelfLifeId}
                    onChange={(e) => setEditShelfLifeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    value={editStorageId}
                    onChange={(e) => setEditStorageId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">None</option>
                    {storageOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bake Time (min)</label>
                    <input
                      type="number"
                      value={editBakeTime}
                      onChange={(e) => setEditBakeTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bake Temp (°C)</label>
                    <input
                      type="number"
                      value={editBakeTemp}
                      onChange={(e) => setEditBakeTemp(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VIEW MODE - Clean cooking interface
  return (
    <div className="max-w-7xl mx-auto">
      {/* View Header */}
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
          <RecipeExportButtons 
            recipe={recipe} 
            costBreakdown={costBreakdown} 
            servings={servings} 
          />
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Recipe
          </button>
        </div>
      </div>

      {/* Recipe Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.name}</h1>
        {recipe.description && (
          <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
        )}
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span>Yield: {servings} {recipe.yieldUnit}</span>
          <span>Total Cost: {formatCurrency(costBreakdown.totalCost * scaleFactor)}</span>
          <span>Cost per serving: {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side - Recipe Image & Servings */}
        <div className="space-y-6">
          {recipe.imageUrl ? (
            <div className="relative">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name} 
                className="w-full h-96 object-cover rounded-2xl shadow-lg"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)} per serving
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No image available</p>
              </div>
            </div>
          )}

          {/* Servings Control */}
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
        </div>

        {/* Right Side - Ingredients and Instructions */}
        <div className="space-y-6">
          {/* Ingredients List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
              <span className="text-sm text-gray-500">
                {checkedItems.size} of {allIngredients.length} checked
              </span>
            </div>
            
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
                              {item.note && (
                                <span className="text-sm text-gray-500 italic block">({item.note})</span>
                              )}
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
                      {item.note && (
                        <span className="text-sm text-gray-500 italic block">({item.note})</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatCurrency((item.ingredient.packPrice / item.ingredient.packQuantity) * item.scaledQuantity)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            {recipe.sections.length > 0 ? (
              <div className="space-y-6">
                {scaledSections.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{section.title}</h3>
                    {section.description && (
                      <p className="text-gray-600 mb-3">{section.description}</p>
                    )}
                    {section.method && (
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {section.method}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose max-w-none">
                {recipe.method ? (
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {recipe.method}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No instructions provided for this recipe.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

