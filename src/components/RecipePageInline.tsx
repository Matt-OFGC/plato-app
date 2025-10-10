"use client";

import { useState, useRef, useEffect } from "react";
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

interface RecipePageInlineProps {
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

export function RecipePageInline({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSave,
}: RecipePageInlineProps) {
  // Cooking mode state
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  // Editable fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description || "");
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || "");
  const [method, setMethod] = useState(recipe.method || "");
  
  // Calculate scaled ingredients
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

  const handleSave = async (field: string, value: string) => {
    const formData = new FormData();
    formData.append("recipeId", recipe.id.toString());
    formData.append("name", field === "name" ? value : name);
    formData.append("description", field === "description" ? value : description);
    formData.append("yieldQuantity", recipe.yieldQuantity.toString());
    formData.append("yieldUnit", recipe.yieldUnit);
    formData.append("method", field === "method" ? value : method);
    formData.append("imageUrl", field === "imageUrl" ? value : imageUrl);
    
    if (recipe.categoryId) formData.append("categoryId", recipe.categoryId.toString());
    if (recipe.shelfLifeId) formData.append("shelfLifeId", recipe.shelfLifeId.toString());
    if (recipe.storageId) formData.append("storageId", recipe.storageId.toString());
    if (recipe.bakeTime) formData.append("bakeTime", recipe.bakeTime.toString());
    if (recipe.bakeTemp) formData.append("bakeTemp", recipe.bakeTemp.toString());

    const useSections = recipe.sections.length > 0;
    formData.append("useSections", useSections.toString());

    if (useSections) {
      const sectionsData = recipe.sections.map((section) => ({
        id: `section-${section.id}`,
        title: section.title,
        description: section.description || "",
        method: section.method || "",
        items: section.items.map((item) => ({
          id: `item-${item.id}`,
          ingredientId: item.ingredient.id,
          quantity: item.quantity.toString(),
          unit: item.unit,
          note: item.note || "",
        })),
      }));
      formData.append("sections", JSON.stringify(sectionsData));
    } else {
      const itemsData = recipe.items.map((item) => ({
        id: `item-${item.id}`,
        ingredientId: item.ingredient.id,
        quantity: item.quantity.toString(),
        unit: item.unit,
        note: item.note || "",
      }));
      formData.append("recipeItems", JSON.stringify(itemsData));
    }

    await onSave(formData);
    setEditingField(null);
  };

  const allIngredients = recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
    : scaledIngredients;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
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
        </div>
      </div>

      {/* Recipe Title - Click to Edit */}
      <div className="mb-8">
        {editingField === "name" ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleSave("name", name)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave("name", name);
              if (e.key === "Escape") {
                setName(recipe.name);
                setEditingField(null);
              }
            }}
            autoFocus
            className="text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-emerald-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <h1 
            onClick={() => setEditingField("name")}
            className="text-4xl font-bold text-gray-900 mb-4 cursor-pointer hover:text-emerald-600 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-emerald-50"
            title="Click to edit"
          >
            {name}
          </h1>
        )}
        
        {editingField === "description" ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleSave("description", description)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDescription(recipe.description || "");
                setEditingField(null);
              }
            }}
            autoFocus
            rows={2}
            className="text-lg text-gray-600 mb-4 w-full border-2 border-emerald-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        ) : (
          <p 
            onClick={() => setEditingField("description")}
            className={`text-lg mb-4 cursor-pointer px-2 py-1 -ml-2 rounded-lg hover:bg-emerald-50 transition-colors ${
              description ? "text-gray-600" : "text-gray-400 italic"
            }`}
            title="Click to edit"
          >
            {description || "Add a description..."}
          </p>
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
          {/* Image - Click to Edit URL */}
          <div className="relative group">
            {recipe.imageUrl || imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl || recipe.imageUrl} 
                  alt={recipe.name} 
                  className="w-full h-96 object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)} per serving
                  </span>
                </div>
                <button
                  onClick={() => setEditingField("imageUrl")}
                  className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-2xl transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-gray-700">
                    Click to change image
                  </span>
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setEditingField("imageUrl")}
                className="w-full h-96 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-all"
              >
                <div className="text-center">
                  <svg className="w-16 h-16 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Click to add image</p>
                </div>
              </div>
            )}
            
            {editingField === "imageUrl" && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center p-6">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Image URL</h3>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onBlur={() => handleSave("imageUrl", imageUrl)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave("imageUrl", imageUrl);
                      if (e.key === "Escape") {
                        setImageUrl(recipe.imageUrl || "");
                        setEditingField(null);
                      }
                    }}
                    autoFocus
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleSave("imageUrl", imageUrl)}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setImageUrl(recipe.imageUrl || "");
                        setEditingField(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          {/* Instructions - Click to Edit */}
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
              editingField === "method" ? (
                <textarea
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  onBlur={() => handleSave("method", method)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setMethod(recipe.method || "");
                      setEditingField(null);
                    }
                  }}
                  autoFocus
                  rows={8}
                  className="w-full border-2 border-emerald-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <div 
                  onClick={() => setEditingField("method")}
                  className={`cursor-pointer px-4 py-3 rounded-lg hover:bg-emerald-50 transition-colors ${
                    method ? "" : "border-2 border-dashed border-gray-300"
                  }`}
                  title="Click to edit"
                >
                  {recipe.method ? (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {recipe.method}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic text-center py-8">Click to add cooking instructions...</p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

