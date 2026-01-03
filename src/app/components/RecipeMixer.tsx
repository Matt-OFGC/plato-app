"use client";

import { useMemo, useState } from "react";
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

type SectionKey = number | "whole";

interface SelectedSection {
  sectionKey: SectionKey;
  title: string;
  items: RecipeItem[];
  overrideMultiplier: number | null; // null means use recipe multiplier
  sourceSection?: RecipeSection;
  isWholeRecipe?: boolean;
}

interface SelectedRecipe {
  recipeId: number;
  recipeName: string;
  multiplier: number;
  sections: SelectedSection[];
  useSectionOverrides: boolean;
}

export function RecipeMixer({ recipes }: RecipeMixerProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<SelectedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [saveName, setSaveName] = useState("Custom Mix");
  const [saveYieldQuantity, setSaveYieldQuantity] = useState("1");
  const [saveYieldUnit, setSaveYieldUnit] = useState("each");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [overridesOpen, setOverridesOpen] = useState<Record<number, boolean>>({});

  const selectedRecipeData = useMemo(
    () => recipes.find((r) => r.id === selectedRecipe),
    [recipes, selectedRecipe]
  );

  const hasSelections = selectedRecipes.length > 0;

  function addSection(
    recipeId: number,
    recipeName: string,
    section: RecipeSection | null,
    wholeRecipe: boolean = false
  ) {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const sectionKey: SectionKey = wholeRecipe ? "whole" : section?.id ?? "whole";
    const items =
      wholeRecipe && recipe.sections.length > 0
        ? recipe.sections.flatMap((s) => s.items)
        : wholeRecipe
          ? recipe.items
          : section?.items || [];

    const title = wholeRecipe
      ? `${recipeName} (Whole Recipe)`
      : section?.title || `${recipeName} Section`;

    setSelectedRecipes((prev) => {
      const existingRecipe = prev.find((r) => r.recipeId === recipeId);
      if (existingRecipe) {
        if (existingRecipe.sections.some((s) => s.sectionKey === sectionKey)) {
          return prev;
        }

        const updated = prev.map((r) =>
          r.recipeId === recipeId
            ? {
                ...r,
                sections: [
                  ...r.sections,
                  {
                    sectionKey,
                    title,
                    items,
                    overrideMultiplier: null,
                    sourceSection: section || undefined,
                    isWholeRecipe: wholeRecipe,
                  },
                ],
              }
            : r
        );
        return updated;
      }

      return [
        ...prev,
        {
      recipeId,
      recipeName,
          multiplier: 1,
          useSectionOverrides: false,
          sections: [
            {
              sectionKey,
              title,
              items,
              overrideMultiplier: null,
              sourceSection: section || undefined,
              isWholeRecipe: wholeRecipe,
            },
          ],
        },
      ];
    });
  }

  function removeSection(recipeId: number, sectionKey: SectionKey) {
    setSelectedRecipes((prev) =>
      prev
        .map((recipe) => {
          if (recipe.recipeId !== recipeId) return recipe;
          const remaining = recipe.sections.filter((s) => s.sectionKey !== sectionKey);
          return { ...recipe, sections: remaining };
        })
        .filter((recipe) => recipe.sections.length > 0)
    );
  }

  function removeRecipe(recipeId: number) {
    setSelectedRecipes((prev) => prev.filter((r) => r.recipeId !== recipeId));
  }

  function updateRecipeMultiplier(recipeId: number, multiplier: number) {
    setSelectedRecipes((prev) =>
      prev.map((recipe) =>
        recipe.recipeId === recipeId ? { ...recipe, multiplier } : recipe
      )
    );
  }

  function updateSectionMultiplier(
    recipeId: number,
    sectionKey: SectionKey,
    multiplier: number | null
  ) {
    setSelectedRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.recipeId !== recipeId) return recipe;
        return {
          ...recipe,
          sections: recipe.sections.map((section) =>
            section.sectionKey === sectionKey
              ? { ...section, overrideMultiplier: multiplier }
              : section
          ),
        };
      })
    );
  }

  function toggleOverrides(recipeId: number, enabled: boolean) {
    setSelectedRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.recipeId !== recipeId) return recipe;
        return {
          ...recipe,
          useSectionOverrides: enabled,
          sections: recipe.sections.map((section) => ({
            ...section,
            overrideMultiplier: enabled ? section.overrideMultiplier : null,
          })),
        };
      })
    );
    setOverridesOpen((prev) => ({ ...prev, [recipeId]: enabled }));
  }

  const combinedIngredients = useMemo(() => {
    const ingredientMap = new Map<
      number,
      { ingredient: Ingredient; totalQuantity: Decimal; unit: string; notes: string[] }
    >();

    selectedRecipes.forEach((recipe) => {
      recipe.sections.forEach((section) => {
        const multiplier =
          recipe.useSectionOverrides && section.overrideMultiplier !== null
            ? section.overrideMultiplier
            : recipe.multiplier;
      section.items.forEach((item) => {
        const existing = ingredientMap.get(item.ingredient.id);
          const quantity = new Decimal(item.quantity.toString()).times(multiplier);

        if (existing) {
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
    });

    return Array.from(ingredientMap.values());
  }, [selectedRecipes]);

  const totalCost = useMemo(
    () =>
      combinedIngredients.reduce((sum, { ingredient, totalQuantity }) => {
    const packPrice = new Decimal(ingredient.packPrice.toString());
    const packQty = new Decimal(ingredient.packQuantity.toString());
        const cost = packPrice.div(packQty).times(totalQuantity);
        return sum.plus(cost);
      }, new Decimal(0)),
    [combinedIngredients]
  );

  async function handleSaveRecipe() {
    if (!hasSelections) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const steps: Array<{
        id: string;
        title: string;
        description?: string | null;
        method?: string | null;
      }> = [];
      const ingredientsPayload: Array<{
        stepId: string;
        ingredientId?: number;
        name: string;
        quantity: number;
        unit: string;
        note?: string | null;
      }> = [];

      selectedRecipes.forEach((recipe) => {
        recipe.sections.forEach((section, index) => {
          const stepId = `${recipe.recipeId}-${section.sectionKey}-${index}`;
          const effectiveMultiplier =
            recipe.useSectionOverrides && section.overrideMultiplier !== null
              ? section.overrideMultiplier
              : recipe.multiplier;

          steps.push({
            id: stepId,
            title: section.title,
            description: section.sourceSection?.description || null,
            method: section.sourceSection?.method || null,
          });

          section.items.forEach((item) => {
            const quantity = new Decimal(item.quantity.toString()).times(effectiveMultiplier);
            ingredientsPayload.push({
              stepId,
              ingredientId: item.ingredient.id,
              name: item.ingredient.name,
              quantity: quantity.toNumber(),
              unit: item.unit,
              note: item.note || null,
            });
          });
        });
      });

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saveName?.trim() || "Custom Mix",
          description: "Created from Recipe Mixer",
          yieldQuantity: saveYieldQuantity || "1",
          yieldUnit: saveYieldUnit || "each",
          steps,
          ingredients: ingredientsPayload,
        }),
      });

      if (!response.ok) {
        let message = "Failed to save recipe";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // ignore parse error
        }
        throw new Error(message);
      }

      setSaveSuccess("Recipe saved successfully");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  }

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
                <button
                onClick={() =>
                  addSection(selectedRecipeData.id, selectedRecipeData.name, null, true)
                }
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  Add Whole Recipe
                </button>
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">Combined Recipe</h2>
          {hasSelections && (
            <button
              onClick={() => setSelectedRecipes([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          )}
        </div>

        {!hasSelections ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-gray-600">Select sections or whole recipes to combine them here</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Selected Recipes & Sections */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Selected Sections:</h3>
              {selectedRecipes.map((recipe) => (
                <div
                  key={recipe.recipeId}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{recipe.recipeName}</p>
                      <p className="text-xs text-gray-600">
                        {recipe.useSectionOverrides
                          ? "Adjust sections individually."
                          : "Whole-recipe multiplier applies to all sections."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                    <button
                        onClick={() => removeRecipe(recipe.recipeId)}
                        className="text-red-600 hover:text-red-700"
                    >
                        Remove
                    </button>
                    </div>
                  </div>
                  
                  {/* Recipe multiplier + mode */}
                  <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Recipe multiplier</span>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          updateRecipeMultiplier(recipe.recipeId, Math.max(0.1, recipe.multiplier - 1))
                        }
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={recipe.multiplier}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateRecipeMultiplier(recipe.recipeId, val);
                          }
                        }}
                        className="w-20 px-2 py-1 text-sm text-center border-l border-r border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => updateRecipeMultiplier(recipe.recipeId, recipe.multiplier + 1)}
                        className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-gray-600">
                      Applies to all sections unless you tweak a section.
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Mode</span>
                    <button
                      onClick={() => toggleOverrides(recipe.recipeId, false)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        !recipe.useSectionOverrides
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Apply to all sections
                    </button>
                    <button
                      onClick={() => toggleOverrides(recipe.recipeId, true)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        recipe.useSectionOverrides
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Per-section tweaks
                    </button>
                    <span className="text-xs text-gray-600">
                      Current: x{recipe.multiplier}
                      {recipe.useSectionOverrides &&
                        ` • ${
                          recipe.sections.filter((s) => s.overrideMultiplier !== null).length
                        } override(s)`}
                    </span>
                  </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setOverridesOpen((prev) => ({
                          ...prev,
                          [recipe.recipeId]: !prev[recipe.recipeId],
                        }))
                      }
                      className="text-sm text-green-700 hover:text-green-800 underline"
                    >
                      {overridesOpen[recipe.recipeId] ? "Hide per-section tweaks" : "Per-section tweaks (optional)"}
                    </button>

                    {overridesOpen[recipe.recipeId] && recipe.useSectionOverrides && (
                      <div className="space-y-2">
                        {recipe.sections.map((section) => {
                          const effectiveMultiplier =
                            recipe.useSectionOverrides && section.overrideMultiplier !== null
                              ? section.overrideMultiplier
                              : recipe.multiplier;
                          return (
                            <div
                              key={section.sectionKey}
                              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{section.title}</p>
                                <p className="text-xs text-gray-600">Uses recipe x{recipe.multiplier} unless set.</p>
                              </div>
                              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                  onClick={() =>
                                    updateSectionMultiplier(
                                      recipe.recipeId,
                                      section.sectionKey,
                                      Math.max(
                                        0.1,
                                        (section.overrideMultiplier ?? recipe.multiplier) - 1
                                      )
                                    )
                                  }
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={section.overrideMultiplier ?? recipe.multiplier}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val > 0) {
                                      updateSectionMultiplier(
                                        recipe.recipeId,
                                        section.sectionKey,
                                        val
                                      );
                                    }
                                  }}
                                  className="w-20 px-2 py-1 text-sm text-center border-l border-r border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() =>
                                    updateSectionMultiplier(
                                      recipe.recipeId,
                                      section.sectionKey,
                                      (section.overrideMultiplier ?? recipe.multiplier) + 1
                                    )
                                  }
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  updateSectionMultiplier(recipe.recipeId, section.sectionKey, null)
                                }
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                              >
                                Reset
                              </button>
                              <span className="text-xs text-gray-600">Now: {effectiveMultiplier}x</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900">Totals</h3>
              <div className="space-y-2">
                {combinedIngredients.map(({ ingredient, totalQuantity, unit }) => (
                  <div key={ingredient.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{ingredient.name}</p>
                    <p className="text-sm text-gray-600">
                      {totalQuantity.toFixed(2)} {unit}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Estimated Total Cost:</span>
                <span className="text-2xl font-bold text-green-600">£{totalCost.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">Based on combined ingredient quantities</p>
            </div>

            {hasSelections && (
              <div className="flex items-center justify-end sticky bottom-0 pt-3 bg-white">
                <button
                  onClick={() => setShowSummary(true)}
                  className="px-5 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 shadow-sm"
                >
                  Review &amp; Save
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Screen */}
      {showSummary && (
        <div className="fixed inset-0 bg-gray-900/70 z-50 flex">
          <div className="bg-white w-full max-w-5xl mx-auto my-6 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Review your mix</p>
                <h3 className="text-xl font-semibold text-gray-900">Combined Recipe Summary</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-semibold text-gray-900">Selections</h4>
                  <div className="space-y-3">
                    {selectedRecipes.map((recipe) => (
                      <div key={recipe.recipeId} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900">
                          {recipe.recipeName} · {recipe.multiplier}x
                        </p>
                        <div className="mt-2 space-y-2">
                          {recipe.sections.map((section) => (
                            <div key={section.sectionKey} className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-800">{section.title}</p>
                                <p className="text-xs text-gray-600">
              Multiplier: {(
                recipe.useSectionOverrides && section.overrideMultiplier !== null
                  ? section.overrideMultiplier
                  : recipe.multiplier
              ).toFixed(2)}
                                </p>
                              </div>
                              {section.isWholeRecipe && (
                                <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                  Whole recipe
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Save as Recipe</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-700">Recipe name</label>
                      <input
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        placeholder="Custom mix name"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-gray-700">Yield quantity</label>
                        <input
                          value={saveYieldQuantity}
                          onChange={(e) => setSaveYieldQuantity(e.target.value)}
                          type="number"
                          min="0.1"
                          step="0.1"
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-sm text-gray-700">Yield unit</label>
                        <input
                          value={saveYieldUnit}
                          onChange={(e) => setSaveYieldUnit(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSaveRecipe}
                      disabled={saving || !hasSelections}
                      className={`w-full px-4 py-2 rounded-lg text-white font-medium ${
                        saving || !hasSelections
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {saving ? "Saving..." : "Save as Recipe"}
                    </button>
                    {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                    {saveSuccess && <p className="text-sm text-green-700">{saveSuccess}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Combined Ingredients</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {combinedIngredients.map(({ ingredient, totalQuantity, unit }) => (
                    <div key={ingredient.id} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{ingredient.name}</p>
                      <p className="text-sm text-gray-600">
                        {totalQuantity.toFixed(2)} {unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="font-semibold text-gray-900">Estimated Total Cost</span>
                <span className="text-2xl font-bold text-green-600">£{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

