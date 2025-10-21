"use client";

import React from "react";
import { Ingredient, RecipeStep } from "@/app/lib/mocks/recipe";
import { scaleQuantity, formatQty } from "@/app/lib/recipe-scaling";

interface IngredientsPanelProps {
  ingredients: Ingredient[];
  steps: RecipeStep[];
  servings: number;
  baseServings: number;
  viewMode: "whole" | "steps" | "edit";
  activeStepIndex: number;
  checklist: {
    checked: Record<string, boolean>;
    toggle: (id: string) => void;
    clear: () => void;
  };
  onIngredientsChange: (ingredients: Ingredient[]) => void;
}

type AggregatedIngredient = Ingredient & {
  stepIds?: string[];
  stepTitles?: string[];
  originalQuantities?: { stepTitle: string; quantity: number }[];
};

export default function IngredientsPanel({
  ingredients,
  steps,
  servings,
  baseServings,
  viewMode,
  activeStepIndex,
  checklist,
  onIngredientsChange,
}: IngredientsPanelProps) {
  // Filter ingredients based on view mode
  const displayedIngredients = React.useMemo(() => {
    if ((viewMode === "steps" || viewMode === "edit") && steps.length > 0) {
      // Steps/Edit mode: show only current step's ingredients
      return ingredients.filter(
        (ing) => ing.stepId === steps[activeStepIndex]?.id
      );
    } else if (viewMode === "whole") {
      // Whole mode: aggregate ingredients by name
      const aggregated: Record<string, AggregatedIngredient> = {};
      
      ingredients.forEach((ing) => {
        const step = steps.find(s => s.id === ing.stepId);
        const stepTitle = step?.title || "Unknown";
        
        if (aggregated[ing.name]) {
          // Same ingredient exists, add quantities and track steps
          aggregated[ing.name].quantity += ing.quantity;
          aggregated[ing.name].stepIds?.push(ing.stepId || "");
          aggregated[ing.name].stepTitles?.push(stepTitle);
          aggregated[ing.name].originalQuantities?.push({
            stepTitle,
            quantity: ing.quantity
          });
        } else {
          // New ingredient, add to aggregated
          aggregated[ing.name] = { 
            ...ing,
            stepIds: [ing.stepId || ""],
            stepTitles: [stepTitle],
            originalQuantities: [{ stepTitle, quantity: ing.quantity }]
          };
        }
      });
      
      return Object.values(aggregated);
    }
    // Should never reach here, but return all as fallback
    return ingredients;
  }, [viewMode, ingredients, steps, activeStepIndex]);

  const [draggedId, setDraggedId] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, ingredientId: string) => {
    if (viewMode !== "edit") return;
    e.dataTransfer.setData("text/plain", ingredientId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(ingredientId);
    // Add some transparency to the dragged element
    (e.target as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (viewMode !== "edit") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (viewMode !== "edit") return;
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = ingredients.findIndex((ing) => ing.id === draggedId);
    const toIndex = ingredients.findIndex((ing) => ing.id === targetId);

    if (fromIndex < 0 || toIndex < 0) return;

    const newIngredients = [...ingredients];
    const [movedItem] = newIngredients.splice(fromIndex, 1);
    newIngredients.splice(toIndex, 0, movedItem);

    onIngredientsChange(newIngredients);
  };

  const handleIngredientChange = (id: string, field: "name" | "quantity" | "unit", value: string) => {
    const newIngredients = ingredients.map((ing) => {
      if (ing.id === id) {
        if (field === "name") {
          return { ...ing, name: value };
        } else if (field === "quantity") {
          // Allow empty string to show placeholder, otherwise parse the number
          if (value === "") {
            return { ...ing, quantity: 0 };
          }
          const numValue = parseFloat(value);
          return { ...ing, quantity: isNaN(numValue) ? 0 : numValue };
        } else if (field === "unit") {
          return { ...ing, unit: value as Ingredient["unit"] };
        }
      }
      return ing;
    });
    onIngredientsChange(newIngredients);
  };

  // Common ingredients database (mock - in real app would come from API)
  const COMMON_INGREDIENTS = [
    { name: "Stork", unit: "g" as const, costPerUnit: 0.005 },
    { name: "Butter", unit: "g" as const, costPerUnit: 0.008 },
    { name: "Caster Sugar", unit: "g" as const, costPerUnit: 0.0025 },
    { name: "Granulated Sugar", unit: "g" as const, costPerUnit: 0.002 },
    { name: "Brown Sugar", unit: "g" as const, costPerUnit: 0.003 },
    { name: "Icing Sugar", unit: "g" as const, costPerUnit: 0.002 },
    { name: "Self Raising Flour", unit: "g" as const, costPerUnit: 0.0018 },
    { name: "Plain Flour", unit: "g" as const, costPerUnit: 0.0015 },
    { name: "Whole Egg", unit: "each" as const, costPerUnit: 0.22 },
    { name: "Egg White", unit: "each" as const, costPerUnit: 0.10 },
    { name: "Egg Yolk", unit: "each" as const, costPerUnit: 0.12 },
    { name: "Vanilla Extract", unit: "tbsp" as const, costPerUnit: 0.3 },
    { name: "Baking Powder", unit: "tbsp" as const, costPerUnit: 0.05 },
    { name: "Baking Soda", unit: "tsp" as const, costPerUnit: 0.03 },
    { name: "Salt", unit: "tsp" as const, costPerUnit: 0.01 },
    { name: "Milk", unit: "ml" as const, costPerUnit: 0.001 },
    { name: "Cream", unit: "ml" as const, costPerUnit: 0.003 },
    { name: "Chocolate", unit: "g" as const, costPerUnit: 0.01 },
    { name: "Cocoa Powder", unit: "g" as const, costPerUnit: 0.008 },
    { name: "Sprinkles", unit: "g" as const, costPerUnit: 0.01 },
  ];

  const [ingredientSearch, setIngredientSearch] = React.useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = React.useState<Record<string, typeof COMMON_INGREDIENTS>>({});

  const handleSearchChange = (id: string, searchTerm: string) => {
    setIngredientSearch({ ...ingredientSearch, [id]: searchTerm });
    
    if (searchTerm.length > 0) {
      const filtered = COMMON_INGREDIENTS.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults({ ...searchResults, [id]: filtered });
    } else {
      const newResults = { ...searchResults };
      delete newResults[id];
      setSearchResults(newResults);
    }
  };

  const handleSelectIngredient = (id: string, ingredientData: typeof COMMON_INGREDIENTS[0]) => {
    const newIngredients = ingredients.map((ing) => {
      if (ing.id === id) {
        return { 
          ...ing, 
          name: ingredientData.name,
          unit: ingredientData.unit,
          costPerUnit: ingredientData.costPerUnit
        };
      }
      return ing;
    });
    onIngredientsChange(newIngredients);
    
    // Clear search
    const newSearch = { ...ingredientSearch };
    delete newSearch[id];
    setIngredientSearch(newSearch);
    const newResults = { ...searchResults };
    delete newResults[id];
    setSearchResults(newResults);
  };

  const handleAddIngredient = () => {
    // In Edit mode, add to current step
    const currentStepId = steps.length > 0 && activeStepIndex >= 0
      ? steps[activeStepIndex]?.id 
      : steps[0]?.id || undefined;
    
    const newIngredient: Ingredient = {
      id: `ing-${Date.now()}`,
      name: "",
      unit: "g",
      quantity: 0, // Start with 0 so placeholder shows
      stepId: currentStepId,
    };
    
    onIngredientsChange([...ingredients, newIngredient]);
  };

  const handleDeleteIngredient = (ingredientId: string) => {
    const newIngredients = ingredients.filter((ing) => ing.id !== ingredientId);
    onIngredientsChange(newIngredients);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px] max-h-[800px] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 z-10">
        <div className="w-1 h-6 bg-emerald-600 rounded-sm" />
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Ingredients</h2>
        
        {/* Add Ingredient Button - Show in Edit mode */}
        {viewMode === "edit" && (
          <button
            onClick={handleAddIngredient}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Step {activeStepIndex + 1}
          </button>
        )}
        
        {viewMode === "steps" && steps.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">
            Step {activeStepIndex + 1}
          </span>
        )}
      </div>

      {/* Ingredients List */}
      <div className="overflow-y-auto flex-1">
        {displayedIngredients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>
              {viewMode === "steps" 
                ? "No ingredients for this step"
                : viewMode === "edit"
                ? "No ingredients for this step. Click 'Add to Step' to add some!"
                : "No ingredients in this recipe"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedIngredients.map((ingredient) => {
              const scaledQuantity = scaleQuantity(
                ingredient.quantity,
                baseServings,
                servings
              );
              const isChecked = checklist.checked[ingredient.id] || false;
              const aggIngredient = ingredient as AggregatedIngredient;
              const isMultiStep = (aggIngredient.stepIds?.length || 0) > 1;

              return (
                <div
                  key={ingredient.id}
                  draggable={viewMode === "edit"}
                  onDragStart={(e) => handleDragStart(e, ingredient.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, ingredient.id)}
                  className={`flex items-center gap-4 px-5 py-4 transition-all ${
                    viewMode === "edit" ? "cursor-move" : ""
                  } ${
                    draggedId === ingredient.id
                      ? "bg-emerald-50 border-2 border-emerald-300 rounded-lg scale-105"
                      : "hover:bg-gray-50"
                  } ${
                    draggedId && draggedId !== ingredient.id
                      ? "border-2 border-dashed border-gray-300 rounded-lg"
                      : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => checklist.toggle(ingredient.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      aria-label={`Mark ${ingredient.name} as done`}
                    />
                  </div>

                  {/* Quantity and Name */}
                  <div className="flex-1">
                    {viewMode === "edit" ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={ingredient.quantity || ""}
                            onChange={(e) =>
                              handleIngredientChange(ingredient.id, "quantity", e.target.value)
                            }
                            className="w-20 px-2 py-1.5 text-sm font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="100"
                          />
                          <select
                            value={ingredient.unit}
                            onChange={(e) =>
                              handleIngredientChange(ingredient.id, "unit", e.target.value)
                            }
                            className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                            <option value="each">each</option>
                          </select>
                          
                          <div className="flex-1 relative z-10">
                            <div className="relative">
                              <input
                                type="text"
                                value={ingredientSearch[ingredient.id] ?? ingredient.name}
                                onChange={(e) => {
                                  handleSearchChange(ingredient.id, e.target.value);
                                  handleIngredientChange(ingredient.id, "name", e.target.value);
                                }}
                                onFocus={() => {
                                  if (!ingredientSearch[ingredient.id]) {
                                    handleSearchChange(ingredient.id, ingredient.name);
                                  }
                                }}
                                onBlur={() => {
                                  // Clear search after a short delay to allow clicks on dropdown items
                                  setTimeout(() => {
                                    const newSearch = { ...ingredientSearch };
                                    delete newSearch[ingredient.id];
                                    setIngredientSearch(newSearch);
                                    const newResults = { ...searchResults };
                                    delete newResults[ingredient.id];
                                    setSearchResults(newResults);
                                  }, 200);
                                }}
                                className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                placeholder="Search or select ingredient..."
                              />
                              <svg 
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            
                            {/* Searchable dropdown - shows all ingredients initially, filters as you type */}
                            {(searchResults[ingredient.id] && searchResults[ingredient.id].length > 0) || ingredientSearch[ingredient.id]?.length === 0 ? (
                              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border-2 border-emerald-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                                <div className="py-1">
                                  {(searchResults[ingredient.id] && searchResults[ingredient.id].length > 0 ? searchResults[ingredient.id] : COMMON_INGREDIENTS).map((result, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSelectIngredient(ingredient.id, result)}
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 flex items-center justify-between group transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                      <span className="font-medium text-gray-900 group-hover:text-emerald-700">
                                        {result.name}
                                      </span>
                                      <span className="text-xs text-gray-500 group-hover:text-emerald-600 font-medium">
                                        {result.unit} • £{result.costPerUnit.toFixed(3)}/{result.unit}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                          
                          <button
                            onClick={() => handleDeleteIngredient(ingredient.id)}
                            className="flex-shrink-0 p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete ingredient"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Cost per line */}
                        {ingredient.costPerUnit && (
                          <div className="text-xs text-gray-500 ml-1">
                            Cost: £{(scaledQuantity * ingredient.costPerUnit).toFixed(2)}
                            <span className="text-gray-400 ml-2">
                              (£{ingredient.costPerUnit.toFixed(3)} per {ingredient.unit})
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div
                          className={`font-bold text-lg min-w-[90px] ${
                            isChecked
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {formatQty(scaledQuantity, ingredient.unit)}
                        </div>
                        <div className="flex-1">
                          <div
                            className={`text-base ${
                              isChecked
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            }`}
                          >
                            {ingredient.name || <span className="text-gray-400 italic">Unnamed ingredient</span>}
                          </div>
                          
                          {/* Cost per line in view modes */}
                          {ingredient.costPerUnit && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              £{(scaledQuantity * ingredient.costPerUnit).toFixed(2)}
                            </div>
                          )}
                          
                          {/* Show step info in Whole view */}
                          {viewMode === "whole" && aggIngredient.stepTitles && (
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              {isMultiStep ? (
                                <>
                                  <span className="text-xs text-amber-600 font-medium">
                                    Used in {aggIngredient.stepTitles.length} steps:
                                  </span>
                                  {aggIngredient.originalQuantities?.map((item, idx) => {
                                    const scaledOrigQty = scaleQuantity(
                                      item.quantity,
                                      baseServings,
                                      servings
                                    );
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700"
                                      >
                                        <span className="font-medium">{item.stepTitle}</span>
                                        <span className="text-amber-500">·</span>
                                        <span>{formatQty(scaledOrigQty, ingredient.unit)}</span>
                                      </span>
                                    );
                                  })}
                                </>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  from {aggIngredient.stepTitles[0]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

