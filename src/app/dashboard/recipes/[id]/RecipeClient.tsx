"use client";

import { RecipeMock } from "@/app/lib/mocks/recipe";
import { useState, useMemo } from "react";
import { useServings, useIngredientChecklist } from "@/app/lib/useLocalChecklist";
import { saveRecipeChanges, saveSellPrice } from "./actions";
import RecipeHeader from "./components/RecipeHeader";
import ServingsControl from "./components/ServingsControl";
import CostAnalysis from "./components/CostAnalysis";
import RecipeNotes from "./components/RecipeNotes";
import RecipeMetadata from "./components/RecipeMetadata";
import RecipeTypeSelector from "./components/RecipeTypeSelector";
import StepNavigation from "./components/StepNavigation";
import IngredientsPanel from "./components/IngredientsPanel";
import InstructionsPanel from "./components/InstructionsPanel";
import CostInsightsModal from "./components/CostInsightsModal";

type ViewMode = "whole" | "steps" | "edit";

interface Props {
  recipe: RecipeMock;
  categories: { id: number; name: string }[];
  storageOptions: { id: number; name: string }[];
  shelfLifeOptions: { id: number; name: string }[];
  recipeId: number;
  availableIngredients: Array<{ id: number; name: string; unit: string; costPerUnit: number }>;
}

export default function RecipeRedesignClient({ recipe, categories, storageOptions, shelfLifeOptions, recipeId, availableIngredients }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("steps");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { servings, setServings } = useServings(recipe.id, recipe.baseServings);
  const checklist = useIngredientChecklist(recipe.id);
  const [localIngredients, setLocalIngredients] = useState(recipe.ingredients);
  const [localSteps, setLocalSteps] = useState(recipe.steps);
  const [recipeType, setRecipeType] = useState<"single" | "batch">("batch");
  const [slicesPerBatch, setSlicesPerBatch] = useState(recipe.baseServings);
  const [category, setCategory] = useState(recipe.category || "Uncategorized");
  const [storage, setStorage] = useState(recipe.storage || "");
  const [shelfLife, setShelfLife] = useState(recipe.shelfLife || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
  // Calculate initial cost per serving for default sell price
  const initialCostPerServing = useMemo(() => {
    const totalCost = localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0);
    return recipeType === "batch" ? totalCost / slicesPerBatch : totalCost;
  }, []);
  
  const [sellPrice, setSellPrice] = useState(recipe.sellPrice || initialCostPerServing * 3);

  // Collect allergens from ingredients
  const allergens = useMemo(() => {
    const allergenSet = new Set<string>();
    localIngredients.forEach(ing => {
      // Find the ingredient in availableIngredients to get its allergens
      const fullIngredient = availableIngredients.find(ai => ai.name === ing.name);
      if (fullIngredient && (fullIngredient as any).allergens) {
        (fullIngredient as any).allergens.forEach((allergen: string) => allergenSet.add(allergen));
      }
    });
    return Array.from(allergenSet);
  }, [localIngredients, availableIngredients]);

  // Sync servings with slicesPerBatch when in batch mode
  const handleRecipeTypeChange = (type: "single" | "batch") => {
    setRecipeType(type);
    if (type === "batch") {
      // When switching to batch, sync servings with slicesPerBatch
      setServings(slicesPerBatch);
    }
  };

  const handleSlicesPerBatchChange = (slices: number) => {
    setSlicesPerBatch(slices);
    // When in batch mode, sync servings with slices
    if (recipeType === "batch") {
      setServings(slices);
    }
  };

  const handleServingsChange = (newServings: number) => {
    setServings(newServings);
    // When in batch mode, sync slicesPerBatch with servings
    if (recipeType === "batch") {
      setSlicesPerBatch(newServings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveRecipeChanges({
        recipeId,
        category,
        storage,
        shelfLife,
        sellPrice,
        ingredients: localIngredients,
        steps: localSteps,
      });

      if (result.success) {
        // Switch back to steps view after saving
        setViewMode("steps");
      } else {
        alert("❌ Failed to save changes: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSellPrice = async (price: number) => {
    const result = await saveSellPrice(recipeId, price);
    if (!result.success) {
      throw new Error(result.error || "Failed to save sell price");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Top Header - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-2">
          {/* Back Button + Header on same line */}
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/recipes"
              className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-white transition-colors border border-gray-200 bg-white shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </a>

            <div className="flex-1 min-w-0">
              <RecipeHeader
                title={recipe.title}
                category={category}
                servings={servings}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCategoryChange={setCategory}
                onSave={handleSave}
                isSaving={isSaving}
                categories={categories}
                imageUrl={recipe.imageUrl}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex Grow to Fill Space */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto px-6 pt-2 pb-1">
          {/* Step Navigation - Show in Steps and Edit modes */}
          {(viewMode === "steps" || viewMode === "edit") && localSteps.length > 0 && (
            <div className="mb-4">
              <StepNavigation
                steps={localSteps}
                activeStepIndex={activeStepIndex}
                onStepChange={setActiveStepIndex}
                totalSteps={localSteps.length}
              />
            </div>
          )}

          {/* Ingredients & Instructions - Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2 max-h-[calc(100vh-350px)]">
            {/* Ingredients */}
            <IngredientsPanel
              ingredients={localIngredients}
              steps={localSteps}
              servings={servings}
              baseServings={recipe.baseServings}
              viewMode={viewMode}
              activeStepIndex={activeStepIndex}
              checklist={checklist}
              onIngredientsChange={setLocalIngredients}
              availableIngredients={availableIngredients}
            />

            {/* Instructions */}
            <InstructionsPanel
              steps={localSteps}
              viewMode={viewMode}
              activeStepIndex={activeStepIndex}
              recipeId={recipe.id}
              onStepsChange={setLocalSteps}
              onActiveStepChange={setActiveStepIndex}
            />
          </div>
        </div>
      </div>

      {/* Bottom Info Bar - Separate Container Cards - FIXED TO BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t-2 border-gray-200 py-1.5 z-40">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Servings Container */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2">
              {viewMode === "edit" ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Type:</span>
                  <div className="bg-gray-100 rounded-lg p-0.5 flex gap-0.5">
                    <button
                      onClick={() => handleRecipeTypeChange("single")}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        recipeType === "single"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Single
                    </button>
                    <button
                      onClick={() => handleRecipeTypeChange("batch")}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        recipeType === "batch"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Batch
                    </button>
                  </div>
                  {recipeType === "batch" && (
                    <>
                      <div className="h-4 w-px bg-gray-300" />
                      <span className="text-xs text-gray-500">Slices:</span>
                      <button
                        onClick={() => handleSlicesPerBatchChange(Math.max(1, slicesPerBatch - 1))}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-700 font-semibold text-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={slicesPerBatch}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val > 0) {
                            handleSlicesPerBatchChange(val);
                          }
                        }}
                        className="w-12 text-center text-base font-bold text-gray-900 border border-gray-300 rounded px-1 py-0.5"
                        min="1"
                      />
                      <button
                        onClick={() => handleSlicesPerBatchChange(slicesPerBatch + 1)}
                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-700 font-semibold text-sm"
                      >
                        +
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Servings</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleServingsChange(Math.max(1, servings - 1))}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-700 font-semibold"
                    >
                      −
                    </button>
                    <span className="text-base font-bold text-gray-900 min-w-[2rem] text-center">{servings}</span>
                    <button
                      onClick={() => handleServingsChange(servings + 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-700 font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cost & COGS Container with Info Button */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Cost</span>
                  <span className="text-base font-bold text-emerald-600">£{(localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)).toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Per Slice</span>
                  <span className="text-base font-semibold text-gray-900">£{((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)).toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">COGS</span>
                  <span className={`text-base font-bold ${
                    ((((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 25 ? 'text-emerald-600' :
                    ((((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 33 ? 'text-green-600' :
                    ((((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {sellPrice > 0 ? `${((((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <button
                  onClick={() => setIsPricingModalOpen(true)}
                  className="w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center text-blue-600"
                  title="View pricing details"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recipe Metadata Container */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2">
              {viewMode === "edit" ? (
                <div className="flex items-center gap-2">
                  <select
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="">Storage...</option>
                    {storageOptions.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                  <select
                    value={shelfLife}
                    onChange={(e) => setShelfLife(e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="">Shelf Life...</option>
                    {shelfLifeOptions.map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                  </select>
                  {allergens && allergens.length > 0 && (
                    <>
                      <div className="h-4 w-px bg-gray-300" />
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-medium text-red-600">{allergens.length}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {allergens && allergens.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium text-red-600">{allergens.length} allergen{allergens.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {storage && (
                    <>
                      {allergens && allergens.length > 0 && <div className="h-4 w-px bg-gray-300" />}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">{storage}</span>
                      </div>
                    </>
                  )}
                  {shelfLife && (
                    <>
                      {(storage || (allergens && allergens.length > 0)) && <div className="h-4 w-px bg-gray-300" />}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">{shelfLife}</span>
                      </div>
                    </>
                  )}
                  {!allergens?.length && !storage && !shelfLife && (
                    <span className="text-xs text-gray-400 italic">No metadata available</span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Pricing Modal */}
      <CostInsightsModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        totalCost={(localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings))}
        costPerServing={((localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0) * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings))}
        recipeType={recipeType}
        slicesPerBatch={slicesPerBatch}
        sellPrice={sellPrice}
        onSellPriceChange={setSellPrice}
        recipeId={recipeId}
        onSave={async (price: number) => {
          await saveSellPrice(recipeId, price);
        }}
      />
    </div>
  );
}

