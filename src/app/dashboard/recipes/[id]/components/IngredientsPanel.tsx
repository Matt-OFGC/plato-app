"use client";

import React from "react";
import { Ingredient, RecipeStep } from "@/lib/mocks/recipe";
import { scaleQuantity, formatQty } from "@/lib/recipe-scaling";
import { computeIngredientUsageCostWithDensity, Unit } from "@/lib/units";

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
    allergens: string[] 
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
              const hasDropdownOpen = searchResults[ingredient.id] || ingredientSearch[ingredient.id]?.length === 0;

              return (
                <div
                  key={ingredient.id}
                  draggable={viewMode === "edit"}
                  onDragStart={(e) => handleDragStart(e, ingredient.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, ingredient.id)}
                  className={`flex items-center gap-4 px-5 py-2.5 transition-all ${
                    viewMode === "edit" ? "cursor-move" : ""
                  } ${
                    draggedId === ingredient.id
                      ? "bg-emerald-50 border-2 border-emerald-300 rounded-lg scale-105"
                      : "hover:bg-gray-50"
                  } ${
                    draggedId && draggedId !== ingredient.id
                      ? "border-2 border-dashed border-gray-300 rounded-lg"
                      : ""
                  } ${
                    hasDropdownOpen ? "relative z-[100]" : ""
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
                            <option value="oz">oz</option>
                            <option value="lb">lb</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="floz">fl oz</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                            <option value="cup">cup</option>
                            <option value="each">each</option>
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
                              <div className="absolute left-0 right-0 z-[110] mt-1 bg-white border-2 border-emerald-300 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
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
                          // ALERT AT THE START - This will show if we reach this code at all
                          if (ingredient.name && ingredient.name.toLowerCase().includes('fluff')) {
                            alert(`COST CALC CODE REACHED FOR FLUFF!\nName: ${ingredient.name}\nOriginal Qty: ${ingredient.quantity}\nScaled Qty: ${scaledQuantity}\nUnit: ${ingredient.unit}\nServings: ${servings}\nBase Servings: ${baseServings}`);
                          }
                          
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
                            console.log('🧮 Starting cost calculation for:', {
                              ingredient: ingredient.name,
                              scaledQuantity,
                              unit: ingredient.unit,
                              packPrice: fullIngredient.packPrice,
                              packQuantity: fullIngredient.packQuantity,
                              packUnit: fullIngredient.packUnit,
                              density: fullIngredient.densityGPerMl,
                            });
                            
                            // DIRECT TEST FOR FLUFF - Check if ingredient name matches first
                            if (ingredient.name && ingredient.name.toLowerCase().includes('fluff')) {
                              alert(`FLUFF FOUND!\nName: ${ingredient.name}\nScaled Qty: ${scaledQuantity}\nUnit: ${ingredient.unit}\nPack Price: ${fullIngredient.packPrice}\nPack Qty: ${fullIngredient.packQuantity}\nPack Unit: ${fullIngredient.packUnit}`);
                            }
                            
                            // DIRECT TEST FOR FLUFF
                            if (ingredient.name === 'Fluff' && scaledQuantity === 10 && ingredient.unit === 'kg') {
                              console.error('🧪 DIRECT FLUFF TEST:', {
                                scaledQuantity,
                                unit: ingredient.unit,
                                packPrice: fullIngredient.packPrice,
                                packQuantity: fullIngredient.packQuantity,
                                packUnit: fullIngredient.packUnit,
                                density: fullIngredient.densityGPerMl,
                              });
                              // Manual calculation: 10kg = 10,000g, pack is 2556g at £22.39
                              const manualCalc = (10000 / 2556) * 22.39;
                              console.error('🧪 MANUAL CALCULATION RESULT:', manualCalc);
                            }
                            
                            const ingredientCost = computeIngredientUsageCostWithDensity(
                              scaledQuantity,
                              ingredient.unit as Unit,
                              fullIngredient.packPrice,
                              fullIngredient.packQuantity,
                              fullIngredient.packUnit as Unit,
                              fullIngredient.densityGPerMl || undefined
                            );
                            
                            // LOG RESULT FOR FLUFF
                            if (ingredient.name === 'Fluff') {
                              console.error('🧪 FLUFF FUNCTION RESULT:', ingredientCost);
                            }
                            
                            console.log('🧮 Cost calculation result:', {
                              ingredient: ingredient.name,
                              cost: ingredientCost,
                              scaledQuantity,
                              unit: ingredient.unit,
                            });
                            
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
                            console.error('❌ Error calculating ingredient cost:', error, {
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
                            className={`font-bold text-base min-w-[80px] flex-shrink-0 ${
                              isChecked
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {formatQty(scaledQuantity, ingredient.unit)}
                          </div>
                          
                          {/* Ingredient Name - Flexible */}
                          <div
                            className={`text-base flex-1 min-w-0 ${
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
                              console.log('🧮 Starting cost calculation (horizontal view) for:', {
                                ingredient: ingredient.name,
                                scaledQuantity,
                                unit: ingredient.unit,
                                packPrice: fullIngredient.packPrice,
                                packQuantity: fullIngredient.packQuantity,
                                packUnit: fullIngredient.packUnit,
                                density: fullIngredient.densityGPerMl,
                              });
                              
                              const ingredientCost = computeIngredientUsageCostWithDensity(
                                scaledQuantity,
                                ingredient.unit as Unit,
                                fullIngredient.packPrice,
                                fullIngredient.packQuantity,
                                fullIngredient.packUnit as Unit,
                                fullIngredient.densityGPerMl || undefined
                              );
                              
                              console.log('🧮 Cost calculation result (horizontal):', {
                                ingredient: ingredient.name,
                                cost: ingredientCost,
                              });
                              
                              // Always show the cost, even if 0
                              const displayCost = isNaN(ingredientCost) || ingredientCost < 0 ? 0 : ingredientCost;
                              
                              return (
                                <div className={`text-sm font-semibold flex-shrink-0 ${
                                  isChecked ? "text-gray-400 line-through" : displayCost > 0 ? "text-gray-600" : "text-gray-400"
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
                          
                          {/* Step Info - Right side (simple case) */}
                          {viewMode === "whole" && aggIngredient.stepTitles && !isMultiStep && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              from {aggIngredient.stepTitles[0]}
                            </span>
                          )}
                          
                          {/* Multi-step indicator - Right side */}
                          {viewMode === "whole" && isMultiStep && (
                            <span className="text-xs text-amber-600 font-medium flex-shrink-0">
                              {aggIngredient.stepTitles!.length} steps
                            </span>
                          )}
                        </div>
                        
                        {/* Multi-step breakdown - Vertical on new line */}
                        {viewMode === "whole" && isMultiStep && aggIngredient.originalQuantities && (
                          <div className="mt-1.5 ml-[92px] flex items-center gap-2 flex-wrap">
                            {aggIngredient.originalQuantities.map((item, idx) => {
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
                          </div>
                        )}
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

