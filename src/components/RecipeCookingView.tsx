"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

interface RecipeCookingViewProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
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
}

export function RecipeCookingView({ recipe, costBreakdown }: RecipeCookingViewProps) {
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

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

  const allIngredients = recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
    : scaledIngredients;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Recipe Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
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
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Side - Recipe Image */}
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
            <div className="w-full h-96 bg-gradient-to-br from-indigo-100 to-amber-100 rounded-2xl shadow-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-indigo-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                {item.scaledQuantity} {item.unit}
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
                        {item.scaledQuantity} {item.unit}
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
