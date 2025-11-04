"use client";

import { useState } from "react";

export default function RecipePageMockup() {
  const [viewMode, setViewMode] = useState<"whole" | "steps" | "edit" | "photos">("whole");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [servings, setServings] = useState(12);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const recipeData = {
    title: "Chocolate Chip Cookies",
    category: "Desserts",
    servings: 12,
    sellPrice: 4.50,
    description: "Classic homemade chocolate chip cookies with a perfect balance of crispy edges and chewy centers.",
    imageUrl: "/images/placeholder-cake.png",
  };

  const [ingredients, setIngredients] = useState([
    { id: "1", name: "All-purpose flour", quantity: 250, unit: "g" as const, stepId: "step1", cost: 0.25 },
    { id: "2", name: "Butter", quantity: 115, unit: "g" as const, stepId: "step1", cost: 0.45 },
    { id: "3", name: "Brown sugar", quantity: 100, unit: "g" as const, stepId: "step1", cost: 0.15 },
    { id: "4", name: "White sugar", quantity: 50, unit: "g" as const, stepId: "step1", cost: 0.08 },
    { id: "5", name: "Eggs", quantity: 1, unit: "each" as const, stepId: "step1", cost: 0.20 },
    { id: "6", name: "Vanilla extract", quantity: 5, unit: "ml" as const, stepId: "step1", cost: 0.10 },
    { id: "7", name: "Chocolate chips", quantity: 200, unit: "g" as const, stepId: "step2", cost: 1.20 },
    { id: "8", name: "Baking soda", quantity: 5, unit: "g" as const, stepId: "step1", cost: 0.02 },
  ]);

  const updateIngredient = (id: string, updates: Partial<typeof ingredients[0]>) => {
    setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, ...updates } : ing));
  };

  const addIngredient = () => {
    const currentStepId = steps[activeStepIndex]?.id || steps[0]?.id;
    setIngredients([...ingredients, {
      id: `ing-${Date.now()}`,
      name: "",
      quantity: 0,
      unit: "g" as const,
      stepId: currentStepId,
      cost: 0,
    }]);
  };

  const deleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const [steps, setSteps] = useState([
    {
      id: "step1",
      title: "Mix Dry Ingredients",
      instructions: ["In a medium bowl, whisk together the flour, baking soda, and salt.", "Set aside."],
      temperatureC: null as number | null,
      durationMin: null as number | null,
      hasTimer: false,
    },
    {
      id: "step2",
      title: "Cream Butter and Sugars",
      instructions: ["In a large bowl, cream together the softened butter, brown sugar, and white sugar until light and fluffy, about 3-4 minutes.", "Beat in the egg and vanilla extract until well combined."],
      temperatureC: null as number | null,
      durationMin: 4 as number | null,
      hasTimer: false,
    },
    {
      id: "step3",
      title: "Combine and Add Chocolate",
      instructions: ["Gradually mix in the dry ingredients until just combined.", "Fold in the chocolate chips."],
      temperatureC: null as number | null,
      durationMin: null as number | null,
      hasTimer: false,
    },
    {
      id: "step4",
      title: "Bake",
      instructions: ["Drop rounded tablespoons of dough onto ungreased baking sheets.", "Bake in preheated oven until golden brown."],
      temperatureC: 190 as number | null,
      durationMin: 10 as number | null,
      hasTimer: true,
    },
  ]);

  const updateStep = (stepId: string, updates: Partial<typeof steps[0]>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const addStep = () => {
    setSteps([...steps, {
      id: `step-${Date.now()}`,
      title: "",
      instructions: [],
      temperatureC: null,
      durationMin: null,
      hasTimer: false,
    }]);
  };

  const deleteStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(s => s.id !== stepId));
      if (activeStepIndex >= steps.length - 1) {
        setActiveStepIndex(Math.max(0, steps.length - 2));
      }
    }
  };

  const totalCost = ingredients.reduce((sum, ing) => sum + ing.cost, 0);
  const profitMargin = recipeData.sellPrice - totalCost;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation Bar - Same as Dashboard */}
      <nav className="bg-white border-b border-neutral-200/60 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <a href="/dashboard/recipes" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back to Recipes</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Recipe Header Card */}
        <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Recipe Image */}
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center text-2xl">
                  🍪
                </div>
              </div>

              {/* Title and Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">{recipeData.title}</h1>
                <div className="flex items-center gap-3 text-sm text-neutral-600 mb-3">
                  <span className="px-2 py-1 bg-neutral-100 rounded-md font-medium">{recipeData.category}</span>
                  <span>•</span>
                  <span>{servings} servings</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-600">£{recipeData.sellPrice.toFixed(2)}</span>
                </div>
                {recipeData.description && (
                  <p className="text-sm text-neutral-600 leading-relaxed">{recipeData.description}</p>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="bg-neutral-100 rounded-lg p-1 flex gap-1">
                  <button
                    onClick={() => setViewMode("whole")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "whole"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Whole
                  </button>
                  <button
                    onClick={() => setViewMode("steps")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "steps"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Steps
                  </button>
                  <button
                    onClick={() => setViewMode("photos")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      viewMode === "photos"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Photos
                  </button>
                </div>
                <button
                  onClick={() => setViewMode(viewMode === "edit" ? "whole" : "edit")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === "edit"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300"
                  }`}
                >
                  {viewMode === "edit" ? "Save" : "Edit"}
                </button>
                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 transition-all">
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step Navigation - Only in Steps/Edit Mode */}
        {(viewMode === "steps" || viewMode === "edit") && (
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(index)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeStepIndex === index
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300"
                  }`}
                >
                  Step {index + 1}: {step.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        {viewMode !== "photos" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ingredients Panel */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-neutral-200/60 flex items-center gap-3">
                <div className="w-1 h-6 bg-emerald-600 rounded-sm" />
                <h2 className="text-lg font-semibold text-neutral-900 uppercase tracking-wide">Ingredients</h2>
                {viewMode === "edit" && (
                  <button
                    onClick={addIngredient}
                    className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    + Add Ingredient
                  </button>
                )}
                {viewMode === "whole" && (
                  <span className="ml-auto text-sm text-neutral-600">{ingredients.length} items</span>
                )}
                {viewMode === "steps" && (
                  <span className="ml-auto text-sm text-neutral-600">Step {activeStepIndex + 1}</span>
                )}
              </div>

              {/* Ingredients List */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-3">
                  {ingredients
                    .filter((ing) => 
                      viewMode === "whole" || 
                      (viewMode === "steps" && ing.stepId === steps[activeStepIndex]?.id) ||
                      (viewMode === "edit" && ing.stepId === steps[activeStepIndex]?.id)
                    )
                    .map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          checkedItems.has(ingredient.id)
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-neutral-50 hover:bg-neutral-100 border border-transparent"
                        }`}
                      >
                        {viewMode !== "edit" && (
                          <input
                            type="checkbox"
                            checked={checkedItems.has(ingredient.id)}
                            onChange={() => toggleCheck(ingredient.id)}
                            className="w-5 h-5 rounded-full border-2 border-neutral-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          {viewMode === "edit" ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={ingredient.quantity || ""}
                                  onChange={(e) => updateIngredient(ingredient.id, { 
                                    quantity: e.target.value ? parseFloat(e.target.value) : 0 
                                  })}
                                  placeholder="100"
                                  className="w-20 px-2 py-1.5 text-sm font-semibold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <select
                                  value={ingredient.unit}
                                  onChange={(e) => updateIngredient(ingredient.id, { 
                                    unit: e.target.value as typeof ingredient.unit 
                                  })}
                                  className="px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="tbsp">tbsp</option>
                                  <option value="tsp">tsp</option>
                                  <option value="each">each</option>
                                </select>
                                <input
                                  type="text"
                                  value={ingredient.name}
                                  onChange={(e) => updateIngredient(ingredient.id, { name: e.target.value })}
                                  placeholder="Ingredient name..."
                                  className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <button 
                                  onClick={() => deleteIngredient(ingredient.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              <div className="text-xs text-neutral-500">
                                Cost: £{ingredient.cost.toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={`text-sm font-medium ${
                                checkedItems.has(ingredient.id) ? "text-emerald-900 line-through" : "text-neutral-900"
                              }`}>
                                {ingredient.name}
                              </p>
                              <p className="text-xs text-neutral-600 mt-0.5">
                                {ingredient.quantity} {ingredient.unit}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                {ingredients.filter((ing) => 
                  viewMode === "whole" || 
                  (viewMode === "steps" && ing.stepId === steps[activeStepIndex]?.id) ||
                  (viewMode === "edit" && ing.stepId === steps[activeStepIndex]?.id)
                ).length === 0 && (
                  <div className="text-center py-8 text-neutral-400">
                    <p>No ingredients for this step</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions Panel */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-neutral-200/60 flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-600 rounded-sm" />
                <h2 className="text-lg font-semibold text-neutral-900 uppercase tracking-wide">Instructions</h2>
                {viewMode === "edit" && (
                  <button
                    onClick={addStep}
                    className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    + Add Step
                  </button>
                )}
                {viewMode === "steps" && (
                  <span className="ml-auto text-sm text-neutral-600">
                    Step {activeStepIndex + 1} of {steps.length}
                  </span>
                )}
              </div>

              {/* Instructions List */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {(viewMode === "whole" ? steps : [steps[activeStepIndex]])
                    .filter(Boolean)
                    .map((step, displayIndex) => {
                      const actualIndex = steps.findIndex(s => s.id === step.id);
                      return (
                        <div key={step.id} className="border-b border-neutral-100 last:border-b-0 pb-6 last:pb-0">
                          <div className="flex items-start gap-4">
                            {/* Step Number Badge */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                              {actualIndex + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Step Title */}
                              <div className="mb-3">
                                {viewMode === "edit" ? (
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                    placeholder="Step title..."
                                    className="px-3 py-1.5 rounded-lg bg-neutral-50 text-neutral-900 text-sm font-medium border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                                  />
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium">
                                    {step.title || `Step ${actualIndex + 1}`}
                                  </span>
                                )}
                                {viewMode === "edit" && steps.length > 1 && (
                                  <button
                                    onClick={() => deleteStep(step.id)}
                                    className="ml-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>

                              {/* Temperature, Duration, Timer Controls */}
                              <div className="flex items-center gap-2 flex-wrap mb-3">
                                {/* Edit Mode Controls */}
                                {viewMode === "edit" && (
                                  <>
                                    {/* Temperature Input */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                                      <svg className="w-3.5 h-3.5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                                      </svg>
                                      <input
                                        type="number"
                                        value={step.temperatureC || ""}
                                        onChange={(e) => updateStep(step.id, { 
                                          temperatureC: e.target.value ? parseInt(e.target.value, 10) : null 
                                        })}
                                        placeholder="--"
                                        className="w-12 bg-transparent border-0 text-xs font-medium text-orange-700 placeholder-orange-400 focus:ring-0 focus:outline-none p-0"
                                      />
                                      <span className="text-xs font-medium text-orange-700">°C</span>
                                    </div>

                                    {/* Duration Input */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                                      <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      <input
                                        type="number"
                                        value={step.durationMin || ""}
                                        onChange={(e) => updateStep(step.id, { 
                                          durationMin: e.target.value ? parseInt(e.target.value, 10) : null 
                                        })}
                                        placeholder="--"
                                        className="w-12 bg-transparent border-0 text-xs font-medium text-blue-700 placeholder-blue-400 focus:ring-0 focus:outline-none p-0"
                                      />
                                      <span className="text-xs font-medium text-blue-700">m</span>
                                    </div>

                                    {/* Timer Toggle */}
                                    {step.durationMin && (
                                      <button
                                        onClick={() => updateStep(step.id, { hasTimer: !step.hasTimer })}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                          step.hasTimer
                                            ? "bg-emerald-600 text-white"
                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                        }`}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Timer
                                      </button>
                                    )}
                                  </>
                                )}

                                {/* View Mode Badges */}
                                {viewMode !== "edit" && (
                                  <>
                                    {step.temperatureC && (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                                        </svg>
                                        {step.temperatureC}°C
                                      </span>
                                    )}
                                    {step.durationMin && (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {step.durationMin}m
                                      </span>
                                    )}
                                    {step.hasTimer && step.durationMin && (
                                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                        Timer
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Instructions Text */}
                              {viewMode === "edit" ? (
                                <textarea
                                  value={step.instructions.join("\n")}
                                  onChange={(e) => updateStep(step.id, { 
                                    instructions: e.target.value.split("\n") 
                                  })}
                                  placeholder="Enter instructions, one per line..."
                                  rows={Math.max(4, step.instructions.length + 1)}
                                  className="w-full border border-neutral-300 rounded-lg p-3 text-sm leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                              ) : (
                                <div className="space-y-2 text-neutral-700 leading-relaxed">
                                  {step.instructions.filter(line => line.trim() !== "").map((instruction, i) => (
                                    <p key={i} className="text-sm">
                                      {instruction}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos View */}
        {viewMode === "photos" && (
          <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="aspect-[3/4] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🍪
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 mb-2">{recipeData.title}</h2>
                    <div className="flex items-center gap-3 text-sm text-neutral-600 mb-4">
                      <span>{recipeData.category}</span>
                      <span>•</span>
                      <span>{servings} servings</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600">£{recipeData.sellPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-neutral-700 leading-relaxed">{recipeData.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-3">Ingredients</h3>
                    <div className="space-y-2">
                      {ingredients.map((ing) => (
                        <div key={ing.id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-b-0">
                          <span className="text-sm text-neutral-700">{ing.name}</span>
                          <span className="text-xs text-neutral-600">{ing.quantity} {ing.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Fixed Bottom Bar - All Features & Tools */}
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-50 border-t border-neutral-200/60 py-2 z-30 pl-4 md:pl-16 lg:pl-20 xl:pl-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap sm:flex-nowrap overflow-x-auto sm:overflow-x-visible">
            
            {/* Servings Container */}
            <div className="bg-white rounded-lg border border-neutral-200/60 shadow-sm px-3 py-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Servings</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-700 font-semibold text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold text-neutral-900 min-w-[2rem] text-center">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-700 font-semibold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Cost & COGS Container */}
            <div className="bg-white rounded-lg border border-neutral-200/60 shadow-sm px-3 py-2 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500">Cost</span>
                  <span className="text-sm font-bold text-emerald-600">£{totalCost.toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-neutral-300" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500">Per Slice</span>
                  <span className="text-sm font-semibold text-neutral-900">£{(totalCost / servings).toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-neutral-300" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500">COGS</span>
                  <span className="text-sm font-bold text-emerald-600">0.4%</span>
                </div>
                <button
                  className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center text-blue-600 flex-shrink-0"
                  title="View pricing details"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recipe Metadata Container */}
            <div className="bg-white rounded-lg border border-neutral-200/60 shadow-sm px-3 py-2 flex-shrink-0 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Allergens */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Milk
                    </span>
                  </div>
                </div>

                {/* Dietary Labels */}
                <div className="h-4 w-px bg-neutral-300 flex-shrink-0" />
                <div className="flex flex-wrap gap-1 flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    ✓ Made without gluten
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    ✓ Vegetarian
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    ✓ Nut-free
                  </span>
                </div>

                {/* Info Button */}
                <button
                  className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center justify-center text-neutral-600 flex-shrink-0"
                  title="View detailed allergen and dietary information"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Storage */}
                <div className="h-4 w-px bg-neutral-300 flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs font-medium text-neutral-700 whitespace-nowrap">Refrigerated</span>
                </div>

                {/* Shelf Life */}
                <div className="h-4 w-px bg-neutral-300 flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-neutral-700 whitespace-nowrap">3 days</span>
                </div>

                {/* Description Button */}
                <div className="h-4 w-px bg-neutral-300 flex-shrink-0" />
                <button
                  className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-100 transition-colors flex-shrink-0"
                  title="Add product description"
                >
                  <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs font-medium text-neutral-700 whitespace-nowrap">Add Description</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add padding to bottom of main content to account for fixed bar */}
      <div className="h-20" />
    </div>
  );
}

