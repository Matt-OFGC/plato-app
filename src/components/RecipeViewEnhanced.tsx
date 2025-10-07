"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

interface RecipeViewEnhancedProps {
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
    subRecipes: Array<{
      id: number;
      quantity: number;
      unit: string;
      note?: string;
      subRecipe: {
        id: number;
        name: string;
        yieldQuantity: number;
        yieldUnit: string;
        items: Array<{
          id: number;
          quantity: number;
          unit: string;
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
    }>;
  };
  costBreakdown: {
    ingredientCosts: Array<{
      ingredientId: number;
      ingredientName: string;
      quantity: number;
      unit: string;
      cost: number;
      costPerUnit: number;
    }>;
    subRecipeCosts: Array<{
      subRecipeId: number;
      subRecipeName: string;
      quantity: number;
      unit: string;
      cost: number;
      costPerUnit: number;
    }>;
    totalCost: number;
    costPerOutputUnit: number;
  };
}

export function RecipeViewEnhanced({ recipe, costBreakdown }: RecipeViewEnhancedProps) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'cost'>('ingredients');
  const [servings, setServings] = useState(recipe.yieldQuantity);

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

  return (
    <div className="max-w-6xl mx-auto">
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
          <div className="flex items-center gap-3">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Edit Recipe
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Share
            </button>
          </div>
        </div>

        {/* Recipe Image */}
        {recipe.imageUrl && (
          <div className="relative">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.name} 
              className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg"
            />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-gray-700">
                {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)} per serving
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Servings Control */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Servings</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setServings(Math.max(1, servings - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-900 min-w-[3rem] text-center">{servings}</span>
            <button 
              onClick={() => setServings(servings + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'ingredients', label: 'Ingredients', icon: '🥘' },
            { id: 'instructions', label: 'Instructions', icon: '📝' },
            { id: 'cost', label: 'Cost Breakdown', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'ingredients' && (
          <div className="space-y-6">
            {recipe.sections.length > 0 ? (
              scaledSections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                  {section.description && (
                    <p className="text-gray-600 mb-4">{section.description}</p>
                  )}
                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                          <span className="font-medium text-gray-900">
                            {item.scaledQuantity} {item.unit}
                          </span>
                          <span className="text-gray-600">{item.ingredient.name}</span>
                          {item.note && (
                            <span className="text-sm text-gray-500 italic">({item.note})</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatCurrency((item.ingredient.packPrice / item.ingredient.packQuantity) * item.scaledQuantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h3>
                <div className="grid gap-3">
                  {scaledIngredients.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="font-medium text-gray-900">
                          {item.scaledQuantity} {item.unit}
                        </span>
                        <span className="text-gray-600">{item.ingredient.name}</span>
                        {item.note && (
                          <span className="text-sm text-gray-500 italic">({item.note})</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatCurrency((item.ingredient.packPrice / item.ingredient.packQuantity) * item.scaledQuantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructions' && (
          <div className="space-y-6">
            {recipe.sections.length > 0 ? (
              scaledSections.map((section) => (
                <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                  {section.method && (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {section.method}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h3>
                {recipe.method ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {recipe.method}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No instructions provided for this recipe.</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-900">Total Recipe Cost</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(costBreakdown.totalCost * scaleFactor)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Cost per serving</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Number of servings</span>
                  <span className="font-medium text-gray-900">{servings}</span>
                </div>
              </div>
            </div>

            {costBreakdown.ingredientCosts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Ingredient Costs</h4>
                <div className="space-y-2">
                  {costBreakdown.ingredientCosts.map((item) => (
                    <div key={item.ingredientId} className="flex justify-between items-center py-1">
                      <span className="text-gray-600">{item.ingredientName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.cost * scaleFactor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {costBreakdown.subRecipeCosts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Sub-Recipe Costs</h4>
                <div className="space-y-2">
                  {costBreakdown.subRecipeCosts.map((item) => (
                    <div key={item.subRecipeId} className="flex justify-between items-center py-1">
                      <span className="text-gray-600">{item.subRecipeName}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.cost * scaleFactor)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
