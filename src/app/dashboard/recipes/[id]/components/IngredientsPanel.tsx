"use client";

import React from "react";
import { Ingredient, RecipeStep } from "@/lib/mocks/recipe";
import { scaleQuantity, formatQty } from "@/lib/recipe-scaling";
import { computeIngredientUsageCostWithDensity, Unit, toBase, BaseUnit } from "@/lib/units";
import { getIngredientDensityOrDefault } from "@/lib/ingredient-densities";

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
  availableIngredients: Array<{ 
    id: number; 
    name: string; 
    unit: string; 
    costPerUnit: number; 
    packPrice: number;
    packQuantity: number;
    packUnit: string;
    densityGPerMl: number | null;
    allergens: string[];
    batchPricing: Array<{ packQuantity: number; packPrice: number }> | null;
  }>;
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
  availableIngredients,
}: IngredientsPanelProps) {
  // Filter ingredients based on view mode
  const displayedIngredients = React.useMemo(() => {
    if ((viewMode === "steps" || viewMode === "edit") && steps.length > 0) {
      // Steps/Edit mode: show only current step's ingredients
      return ingredients.filter(
        (ing) => ing.stepId === steps[activeStepIndex]?.id
      );
    } else if (viewMode === "whole") {
      // Whole mode: return all ingredients (grouped by section in render)
      return ingredients;
    }
    // Should never reach here, but return all as fallback
    return ingredients;
  }, [viewMode, ingredients, steps, activeStepIndex]);

  // Group ingredients by section for whole view
  const ingredientsBySection = React.useMemo(() => {
    if (viewMode !== "whole") return null;
    
    const grouped: Record<string, Ingredient[]> = {};
    
    ingredients.forEach((ing) => {
      const step = steps.find(s => s.id === ing.stepId);
      const stepTitle = step?.title || "Unknown";
      
      if (!grouped[stepTitle]) {
        grouped[stepTitle] = [];
      }
      grouped[stepTitle].push(ing);
    });
    
    // Return as array of { sectionTitle, ingredients } sorted by step order
    return steps
      .map(step => ({
        sectionTitle: step.title,
        ingredients: grouped[step.title] || []
      }))
      .filter(group => group.ingredients.length > 0);
  }, [viewMode, ingredients, steps]);

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
          // Validate: must be a valid number, positive, and not unreasonably large
          if (isNaN(numValue) || numValue < 0) {
            return { ...ing, quantity: 0 };
          }
          // Reasonable max limit to prevent data issues
          const MAX_QUANTITY = 1000000;
          return { ...ing, quantity: Math.min(numValue, MAX_QUANTITY) };
        } else if (field === "unit") {
          return { ...ing, unit: value as Ingredient["unit"] };
        }
      }
      return ing;
    });
    onIngredientsChange(newIngredients);
  };

  const [ingredientSearch, setIngredientSearch] = React.useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = React.useState<Record<string, typeof availableIngredients>>({});

  const handleSearchChange = (id: string, searchTerm: string) => {
    setIngredientSearch({ ...ingredientSearch, [id]: searchTerm });
    
    if (searchTerm.length > 0) {
      const filtered = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults({ ...searchResults, [id]: filtered });
    } else {
      const newResults = { ...searchResults };
      delete newResults[id];
      setSearchResults(newResults);
    }
  };

  const handleSelectIngredient = (id: string, ingredientData: typeof availableIngredients[0]) => {
    const newIngredients = ingredients.map((ing) => {
      if (ing.id === id) {
        return { 
          ...ing, 
          name: ingredientData.name,
          unit: ingredientData.unit as Ingredient["unit"],
          costPerUnit: ingredientData.costPerUnit, // Keep for display, but cost will be calculated properly
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

  // Helper function to render a single ingredient item
  const renderIngredientItem = (ingredient: Ingredient) => {
    const scaledQuantity = scaleQuantity(
      ingredient.quantity,
      baseServings,
      servings
    );
    const isChecked = checklist.checked[ingredient.id] || false;
    const hasDropdownOpen = searchResults[ingredient.id] || ingredientSearch[ingredient.id]?.length === 0;

    return (
      <div
        key={ingredient.id}
        draggable={viewMode === "edit"}
        onDragStart={(e) => handleDragStart(e, ingredient.id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, ingredient.id)}
        className={`flex items-center gap-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer ${
          viewMode === "edit" ? "cursor-move" : ""
        } ${
          draggedId === ingredient.id
            ? "bg-emerald-50 border-2 border-emerald-300 scale-105"
            : ""
        } ${
          draggedId && draggedId !== ingredient.id
            ? "border-2 border-dashed border-gray-300"
            : ""
        } ${
          hasDropdownOpen ? "relative z-[999]" : ""
        }`}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0 relative">
          {isChecked ? (
            <div className="w-5 h-5 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center transition-all">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center transition-all" />
          )}
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => checklist.toggle(ingredient.id)}
            className="absolute inset-0 opacity-0 w-5 h-5 cursor-pointer"
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
                  <optgroup label="Weight">
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mg">mg</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                  </optgroup>
                  <optgroup label="Volume">
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="floz">fl oz</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="cup">cup</option>
                  </optgroup>
                  <optgroup label="Count">
                    <option value="each">each</option>
                    <option value="slices">slices</option>
                  </optgroup>
                  <optgroup label="Size">
                    <option value="large">large</option>
                    <option value="medium">medium</option>
                    <option value="small">small</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="pinch">pinch</option>
                    <option value="dash">dash</option>
                  </optgroup>
                </select>
                
                <div className="flex-1 relative">
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
                    <div className="absolute left-0 right-0 z-[9999] mt-1 bg-white border-2 border-emerald-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                      <div className="py-1">
                        {(searchResults[ingredient.id] && searchResults[ingredient.id].length > 0 ? searchResults[ingredient.id] : availableIngredients).map((result, idx) => (
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
              
              {/* Cost per line - Always show */}
              {(() => {
                const fullIngredient = availableIngredients.find(ai => 
                  ai.name.toLowerCase().trim() === ingredient.name?.toLowerCase().trim()
                );
                
                // If ingredient not found in available ingredients, show message
                if (!fullIngredient) {
                  return (
                    <div className="text-xs text-amber-600 ml-1">
                      No pricing data
                    </div>
                  );
                }
                
                // If no quantity, can't calculate
                if (!ingredient.quantity || !scaledQuantity || scaledQuantity <= 0) {
                  return (
                    <div className="text-xs text-gray-400 ml-1">
                      £0.00
                    </div>
                  );
                }
                
                // If missing pack price data, show message
                if (!fullIngredient.packPrice || !fullIngredient.packQuantity || fullIngredient.packQuantity <= 0) {
                  return (
                    <div className="text-xs text-amber-600 ml-1">
                      No pack price set
                    </div>
                  );
                }
                
                try {
                  // DIRECT CALCULATION using toBase
                  // Don't pass density to toBase - it should only be used for cross-conversion
                  const recipeBase = toBase(scaledQuantity, ingredient.unit as Unit);
                  
                  // packQuantity is already in base units, packUnit is the base unit
                  // So we don't need to convert - just use packQuantity directly as the base amount
                  const packBase = {
                    amount: fullIngredient.packQuantity,
                    base: fullIngredient.packUnit as BaseUnit
                  };
                  
                  // Debug logging
                  if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') {
                    console.log('tsp/tbsp calculation:', {
                      ingredient: ingredient.name,
                      recipeQty: scaledQuantity,
                      recipeUnit: ingredient.unit,
                      recipeBase: recipeBase.base,
                      recipeAmount: recipeBase.amount,
                      packQty: fullIngredient.packQuantity,
                      packUnit: fullIngredient.packUnit,
                      packBase: packBase.base,
                      packAmount: packBase.amount,
                      packPrice: fullIngredient.packPrice,
                      density: fullIngredient.densityGPerMl,
                      hasDensity: !!fullIngredient.densityGPerMl
                    });
                  }
                  
                  let ingredientCost = 0;
                  
                  // Get density (user-set or auto-lookup)
                  const density = getIngredientDensityOrDefault(
                    fullIngredient.name,
                    fullIngredient.densityGPerMl
                  );
                  
                  // If base units match, calculate directly
                  if (recipeBase.base === packBase.base && recipeBase.amount > 0 && packBase.amount > 0 && isFinite(recipeBase.amount) && isFinite(packBase.amount)) {
                    const costPerBaseUnit = fullIngredient.packPrice / packBase.amount;
                    ingredientCost = recipeBase.amount * costPerBaseUnit;
                    if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') {
                      console.log('✓ Matched base units, cost:', ingredientCost);
                    }
                  } else if (density && recipeBase.base === 'ml' && packBase.base === 'g') {
                    // Recipe is volume (ml), pack is weight (g) - convert via density
                    const packVolume = packBase.amount / density;
                    const costPerMl = fullIngredient.packPrice / packVolume;
                    ingredientCost = recipeBase.amount * costPerMl;
                    if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') {
                      console.log('✓ Cross-conversion ml->g with density', density, 'cost:', ingredientCost);
                    }
                  } else if (density && recipeBase.base === 'g' && packBase.base === 'ml') {
                    // Recipe is weight (g), pack is volume (ml) - convert via density
                    const packWeight = packBase.amount * density;
                    const costPerGram = fullIngredient.packPrice / packWeight;
                    ingredientCost = recipeBase.amount * costPerGram;
                    if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') {
                      console.log('✓ Cross-conversion g->ml with density', density, 'cost:', ingredientCost);
                    }
                  } else {
                    // Fallback to original function if units don't match and no density conversion possible
                    ingredientCost = computeIngredientUsageCostWithDensity(
                      scaledQuantity,
                      ingredient.unit as Unit,
                      fullIngredient.packPrice,
                      fullIngredient.packQuantity,
                      fullIngredient.packUnit as Unit,
                      density || undefined,
                      fullIngredient.batchPricing || null
                    );
                    if (ingredient.unit === 'tbsp' || ingredient.unit === 'tsp') {
                      console.log('Fallback cost:', ingredientCost, 'density used:', density);
                    }
                  }
                  
                  // Always show the cost, even if 0
                  const displayCost = isNaN(ingredientCost) || ingredientCost < 0 ? 0 : ingredientCost;
                  const costPerUnit = fullIngredient.packQuantity > 0 
                    ? fullIngredient.packPrice / fullIngredient.packQuantity 
                    : 0;
                  
                  return (
                    <div className="text-xs text-gray-500 ml-1">
                      Cost: £{displayCost.toFixed(2)}
                      <span className="text-gray-400 ml-2">
                        (£{costPerUnit.toFixed(3)} per {fullIngredient.packUnit})
                      </span>
                    </div>
                  );
                } catch (error) {
                  console.error('Error calculating ingredient cost:', error, {
                    ingredient: ingredient.name,
                    scaledQuantity,
                    unit: ingredient.unit,
                    packPrice: fullIngredient.packPrice,
                    packQuantity: fullIngredient.packQuantity,
                    packUnit: fullIngredient.packUnit,
                  });
                  return (
                    <div className="text-xs text-red-600 ml-1">
                      Calculation error
                    </div>
                  );
                }
              })()}
            </div>
          ) : (
            <div className="w-full">
              {/* Main Row - Always horizontal */}
              <div className="flex items-center gap-3">
                {/* Quantity - Compact */}
                <div
                  className={`text-sm font-bold min-w-[80px] flex-shrink-0 ${
                    isChecked
                      ? "text-gray-400 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {formatQty(scaledQuantity, ingredient.unit)}
                </div>
                
                {/* Ingredient Name - Flexible */}
                <div
                  className={`text-sm font-medium flex-1 min-w-0 ${
                    isChecked
                      ? "text-gray-400 line-through"
                      : "text-gray-700"
                  }`}
                >
                  {ingredient.name || <span className="text-gray-400 italic">Unnamed ingredient</span>}
                </div>
                
                {/* Cost - Right side - Always show */}
                {(() => {
                  const fullIngredient = availableIngredients.find(ai => 
                    ai.name.toLowerCase().trim() === ingredient.name?.toLowerCase().trim()
                  );
                  
                  // If ingredient not found, show message
                  if (!fullIngredient) {
                    return (
                      <div className={`text-xs flex-shrink-0 ${
                        isChecked ? "text-gray-400 line-through" : "text-amber-600"
                      }`}>
                        No price data
                      </div>
                    );
                  }
                  
                  // If no quantity, show £0.00
                  if (!ingredient.quantity || !scaledQuantity || scaledQuantity <= 0) {
                    return (
                      <div className={`text-sm font-semibold flex-shrink-0 ${
                        isChecked ? "text-gray-400 line-through" : "text-gray-400"
                      }`}>
                        £0.00
                      </div>
                    );
                  }
                  
                  // If missing pack price data, show message
                  if (!fullIngredient.packPrice || !fullIngredient.packQuantity || fullIngredient.packQuantity <= 0) {
                    return (
                      <div className={`text-xs flex-shrink-0 ${
                        isChecked ? "text-gray-400 line-through" : "text-amber-600"
                      }`}>
                        No pack price
                      </div>
                    );
                  }
                  
                  try {
                    // DIRECT CALCULATION using toBase
                    // Don't pass density to toBase - it should only be used for cross-conversion
                    const recipeBase = toBase(scaledQuantity, ingredient.unit as Unit);
                    
                    // packQuantity is already in base units, packUnit is the base unit
                    // So we don't need to convert - just use packQuantity directly as the base amount
                    const packBase = {
                      amount: fullIngredient.packQuantity,
                      base: fullIngredient.packUnit as BaseUnit
                    };
                    
                    let ingredientCost = 0;
                    
                    // Get density (user-set or auto-lookup)
                    const density = getIngredientDensityOrDefault(
                      fullIngredient.name,
                      fullIngredient.densityGPerMl
                    );
                    
                    // If base units match, calculate directly
                    if (recipeBase.base === packBase.base && recipeBase.amount > 0 && packBase.amount > 0 && isFinite(recipeBase.amount) && isFinite(packBase.amount)) {
                      const costPerBaseUnit = fullIngredient.packPrice / packBase.amount;
                      ingredientCost = recipeBase.amount * costPerBaseUnit;
                    } else if (density && recipeBase.base === 'ml' && packBase.base === 'g') {
                      // Recipe is volume (ml), pack is weight (g) - convert via density
                      const packVolume = packBase.amount / density;
                      const costPerMl = fullIngredient.packPrice / packVolume;
                      ingredientCost = recipeBase.amount * costPerMl;
                    } else if (density && recipeBase.base === 'g' && packBase.base === 'ml') {
                      // Recipe is weight (g), pack is volume (ml) - convert via density
                      const packWeight = packBase.amount * density;
                      const costPerGram = fullIngredient.packPrice / packWeight;
                      ingredientCost = recipeBase.amount * costPerGram;
                    } else {
                      // Fallback to original function if units don't match and no density conversion possible
                      ingredientCost = computeIngredientUsageCostWithDensity(
                        scaledQuantity,
                        ingredient.unit as Unit,
                        fullIngredient.packPrice,
                        fullIngredient.packQuantity,
                        fullIngredient.packUnit as Unit,
                        density || undefined,
                        fullIngredient.batchPricing || null
                      );
                    }
                    
                    // Always show the cost, even if 0
                    const displayCost = isNaN(ingredientCost) || ingredientCost < 0 ? 0 : ingredientCost;
                    
                    return (
                      <div className={`text-sm font-bold flex-shrink-0 ${
                        isChecked ? "text-gray-400" : "text-gray-900"
                      }`}>
                        £{displayCost.toFixed(2)}
                      </div>
                    );
                  } catch (error) {
                    console.error('Error calculating ingredient cost:', error, {
                      ingredient: ingredient.name,
                      scaledQuantity,
                      unit: ingredient.unit,
                      packPrice: fullIngredient.packPrice,
                      packQuantity: fullIngredient.packQuantity,
                      packUnit: fullIngredient.packUnit,
                    });
                    return (
                      <div className={`text-xs flex-shrink-0 ${
                        isChecked ? "text-gray-400 line-through" : "text-red-600"
                      }`}>
                        Error
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-gray-200/60 shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200/50 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">INGREDIENTS</h2>
        {viewMode === "steps" && steps.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">Step {activeStepIndex + 1}</p>
        )}
        
        {/* Add Ingredient Button - Show in Edit mode */}
        {viewMode === "edit" && (
          <button
            onClick={handleAddIngredient}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add to Step {activeStepIndex + 1}
          </button>
        )}
      </div>

      {/* Ingredients List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-4">
        {viewMode === "whole" && ingredientsBySection ? (
          // Whole view: Group by sections
          ingredientsBySection.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-gray-400">
              <p className="text-sm md:text-base">No ingredients in this recipe</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {ingredientsBySection.map((sectionGroup, sectionIndex) => (
                <div key={sectionIndex} className="space-y-2">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 pt-2 pb-1 border-b border-gray-200">
                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {sectionGroup.sectionTitle}
                    </h3>
                  </div>
                  
                  {/* Section Ingredients */}
                  {sectionGroup.ingredients.map((ingredient) => {
                    return renderIngredientItem(ingredient);
                  })}
                </div>
              ))}
            </div>
          )
        ) : displayedIngredients.length === 0 ? (
          <div className="p-6 md:p-8 text-center text-gray-400">
            <p className="text-sm md:text-base">
              {viewMode === "steps" 
                ? "No ingredients for this step"
                : viewMode === "edit"
                ? "No ingredients for this step. Click 'Add to Step' to add some!"
                : "No ingredients in this recipe"}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-2">
            {displayedIngredients.map((ingredient) => {
              return renderIngredientItem(ingredient);
            })}
          </div>
        )}
      </div>
    </div>
  );
}

