"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Decimal from "decimal.js";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: string;
  packUnit: string;
  packPrice: string;
  densityGPerMl: string | null;
  currency: string;
}

interface RecipeItem {
  id: number;
  quantity: string;
  unit: string;
  note: string | null;
  ingredient: Ingredient;
}

interface RecipeSection {
  id: number;
  title: string;
  description: string | null;
  method: string | null;
  bakeTemp: number | null;
  bakeTime: number | null;
  order: number;
  items: RecipeItem[];
}

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  sections: RecipeSection[];
  items: RecipeItem[]; // For recipes without sections
}

interface RecipeMixerProps {
  recipes: Recipe[];
}

interface SelectedSection {
  recipeId: number;
  recipeName: string;
  section?: RecipeSection;
  items: RecipeItem[]; // For whole recipe or section items
  title: string;
}

export function RecipeMixer({ recipes }: RecipeMixerProps) {
  const [selectedSections, setSelectedSections] = useState<SelectedSection[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);

  const selectedRecipeData = recipes.find((r) => r.id === selectedRecipe);

  function addSection(
    recipeId: number,
    recipeName: string,
    section: RecipeSection | null,
    wholeRecipe: boolean = false
  ) {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const newSection: SelectedSection = {
      recipeId,
      recipeName,
      section: section || undefined,
      items: wholeRecipe ? recipe.items : section?.items || [],
      title: wholeRecipe ? `${recipeName} (Whole Recipe)` : section?.title || "",
    };

    setSelectedSections([...selectedSections, newSection]);
  }

  function removeSection(index: number) {
    setSelectedSections(selectedSections.filter((_, i) => i !== index));
  }

  // Combine all ingredients from selected sections
  function getCombinedIngredients() {
    const ingredientMap = new Map<number, { ingredient: Ingredient; totalQuantity: Decimal; unit: string; notes: string[] }>();

    selectedSections.forEach((section) => {
      section.items.forEach((item) => {
        const existing = ingredientMap.get(item.ingredient.id);
        const quantity = new Decimal(item.quantity.toString());

        if (existing) {
          // Same ingredient - add quantities (assuming same unit)
          existing.totalQuantity = existing.totalQuantity.plus(quantity);
          if (item.note) {
            existing.notes.push(item.note);
          }
        } else {
          ingredientMap.set(item.ingredient.id, {
            ingredient: item.ingredient,
            totalQuantity: quantity,
            unit: item.unit,
            notes: item.note ? [item.note] : [],
          });
        }
      });
    });

    return Array.from(ingredientMap.values());
  }

  const combinedIngredients = getCombinedIngredients();

  // Calculate total cost
  const totalCost = combinedIngredients.reduce((sum, { ingredient, totalQuantity, unit }) => {
    // Simplified cost calculation (you'd use your existing unit conversion logic)
    const packPrice = new Decimal(ingredient.packPrice.toString());
    const packQty = new Decimal(ingredient.packQuantity.toString());
    const itemQty = totalQuantity;
    
    // Basic calculation - you can integrate your existing computeIngredientCost function
    const cost = packPrice.div(packQty).times(itemQty);
    return sum.plus(cost);
  }, new Decimal(0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Recipe Browser */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Select Recipe Sections</h2>
        
        <select
          value={selectedRecipe || ""}
          onChange={(e) => setSelectedRecipe(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="">Choose a recipe...</option>
          {recipes.map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name}
              {recipe.sections.length > 0 ? ` (${recipe.sections.length} sections)` : " (no sections)"}
            </option>
          ))}
        </select>

        {selectedRecipeData && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{selectedRecipeData.name}</h3>
              {selectedRecipeData.sections.length === 0 && (
                <button
                  onClick={() => addSection(selectedRecipeData.id, selectedRecipeData.name, null, true)}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Add Whole Recipe
                </button>
              )}
            </div>

            {selectedRecipeData.sections.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Select sections to add:</p>
                {selectedRecipeData.sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {section.items.length} ingredient{section.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => addSection(selectedRecipeData.id, selectedRecipeData.name, section)}
                      className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                This recipe has no sections. You can add the whole recipe.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: Combined Recipe */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Combined Recipe</h2>
          {selectedSections.length > 0 && (
            <button
              onClick={() => setSelectedSections([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedSections.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-600">Select sections from recipes to combine them here</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Selected Sections */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Selected Sections:</h3>
              {selectedSections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{section.title}</p>
                    <p className="text-sm text-gray-600">from {section.recipeName}</p>
                  </div>
                  <button
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Combined Ingredients */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Combined Ingredients:</h3>
              <div className="space-y-2">
                {combinedIngredients.map(({ ingredient, totalQuantity, unit, notes }) => (
                  <div key={ingredient.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{ingredient.name}</p>
                        <p className="text-sm text-gray-600">
                          {totalQuantity.toFixed(2)} {unit}
                        </p>
                        {notes.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1">Notes: {notes.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Estimated Total Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  £{totalCost.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Based on combined ingredient quantities
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

