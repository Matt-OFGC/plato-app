"use client";

import { useState } from "react";
import { Unit } from "@/generated/prisma";

interface Ingredient {
  id: number;
  name: string;
}

interface RecipeFormSimplifiedProps {
  ingredients: Ingredient[];
  onSubmit: (data: any) => void;
}

export function RecipeFormSimplified({ ingredients, onSubmit }: RecipeFormSimplifiedProps) {
  const [recipeType, setRecipeType] = useState<"single" | "batch">("single");
  const [name, setName] = useState("");
  const [servings, setServings] = useState(1);
  const [recipeItems, setRecipeItems] = useState<Array<{
    ingredientId: number;
    quantity: string;
    unit: Unit;
  }>>([{ ingredientId: 0, quantity: "", unit: "g" as Unit }]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData object for server action
    const formData = new FormData();
    formData.append("name", name);
    formData.append("recipeType", recipeType);
    formData.append("servings", servings.toString());
    
    // Add each ingredient
    recipeItems
      .filter(item => item.ingredientId && item.quantity)
      .forEach(item => {
        formData.append("ingredientId", item.ingredientId.toString());
        formData.append("quantity", item.quantity);
        formData.append("unit", item.unit);
      });
    
    onSubmit(formData);
  };

  const addIngredient = () => {
    setRecipeItems([...recipeItems, { ingredientId: 0, quantity: "", unit: "g" as Unit }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeItems(updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Recipe Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipe Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bacon Sandwich, Victoria Sponge Cake"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          required
        />
      </div>

      {/* Recipe Type Selector - THIS IS THE KEY! */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border-2 border-emerald-200">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          What type of recipe is this?
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Single Serving */}
          <button
            type="button"
            onClick={() => { setRecipeType("single"); setServings(1); }}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              recipeType === "single"
                ? "border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-200"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                recipeType === "single" ? "bg-emerald-500" : "bg-gray-300"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Single Serving</h3>
                <p className="text-sm text-gray-600">
                  Makes 1 item
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Examples: Sandwich, Burger, Cocktail, Coffee
                </p>
              </div>
            </div>
          </button>

          {/* Batch/Multiple Servings */}
          <button
            type="button"
            onClick={() => setRecipeType("batch")}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              recipeType === "batch"
                ? "border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-200"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                recipeType === "batch" ? "bg-emerald-500" : "bg-gray-300"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Batch Recipe</h3>
                <p className="text-sm text-gray-600">
                  Makes multiple servings
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Examples: Cake tray (24 slices), Soup pot (10 bowls)
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Batch Size - Only show for batch recipes */}
      {recipeType === "batch" && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            How many servings does one batch make?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              min="1"
              className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
              required
            />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Example:</span> If you bake a tray that you cut into 24 slices, enter <strong>24</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The app will calculate cost per slice automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
          <p className="text-sm text-gray-500">
            {recipeType === "single" ? "For 1 serving" : `For 1 batch (${servings} servings)`}
          </p>
        </div>

        <div className="space-y-3">
          {recipeItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start">
              {/* Ingredient Selection */}
              <select
                value={item.ingredientId}
                onChange={(e) => updateIngredient(index, "ingredientId", parseInt(e.target.value))}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="0">Select ingredient...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>

              {/* Quantity */}
              <input
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                placeholder="Amount"
                className="w-28 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                required
              />

              {/* Unit */}
              <select
                value={item.unit}
                onChange={(e) => updateIngredient(index, "unit", e.target.value as Unit)}
                className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="each">each</option>
                <option value="slices">slices</option>
                <option value="tsp">tsp</option>
                <option value="tbsp">tbsp</option>
                <option value="cup">cup</option>
              </select>

              {/* Remove Button */}
              {recipeItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIngredient}
          className="mt-3 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors font-medium"
        >
          + Add Ingredient
        </button>
      </div>

      {/* Cost Preview - Show what will be calculated */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">💰 Cost Breakdown (Preview)</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total batch cost:</span>
            <span className="font-semibold">Calculated after save</span>
          </div>
          {recipeType === "batch" && (
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-600">Cost per serving:</span>
              <span className="font-semibold">Total ÷ {servings} servings</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {recipeType === "single" 
            ? "You'll get the exact cost for making 1 serving"
            : `You'll get the total cost for the batch AND cost per individual serving`
          }
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-lg"
      >
        Create Recipe & Calculate Cost
      </button>
    </form>
  );
}

