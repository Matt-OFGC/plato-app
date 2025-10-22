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
  
  // Calculate initial cost per serving for default sell price
  const initialCostPerServing = useMemo(() => {
    const totalCost = localIngredients.reduce((sum, ing) => sum + (ing.quantity * (ing.costPerUnit || 0)), 0);
    return recipeType === "batch" ? totalCost / slicesPerBatch : totalCost;
  }, []);
  
  const [sellPrice, setSellPrice] = useState(recipe.sellPrice || initialCostPerServing * 3);

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
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
        <div className="max-w-[1600px] mx-auto px-6 py-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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

      {/* Bottom Info Bar - Horizontal Row */}
      <div className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Servings Control or Recipe Type Selector */}
            <div>
              {viewMode === "edit" ? (
                <RecipeTypeSelector
                  recipeType={recipeType}
                  onRecipeTypeChange={handleRecipeTypeChange}
                  slicesPerBatch={slicesPerBatch}
                  onSlicesPerBatchChange={handleSlicesPerBatchChange}
                />
              ) : (
                <ServingsControl
                  servings={servings}
                  onServingsChange={handleServingsChange}
                  recipeType={recipeType}
                  baseServings={recipe.baseServings}
                />
              )}
            </div>
            
            {/* Cost Analysis */}
            <div>
              <CostAnalysis
                ingredients={localIngredients}
                servings={servings}
                baseServings={recipe.baseServings}
                recipeType={recipeType}
                slicesPerBatch={slicesPerBatch}
                sellPrice={sellPrice}
                onSellPriceChange={setSellPrice}
                recipeId={recipeId}
                onSaveSellPrice={handleSaveSellPrice}
              />
            </div>
            
            {/* Recipe Metadata & Notes */}
            <div className="space-y-4">
              <RecipeMetadata
                allergens={recipe.allergens}
                storage={storage}
                shelfLife={shelfLife}
                viewMode={viewMode}
                storageOptions={storageOptions}
                shelfLifeOptions={shelfLifeOptions}
                onStorageChange={setStorage}
                onShelfLifeChange={setShelfLife}
              />
              
              {recipe.notes && (
                <RecipeNotes notes={recipe.notes} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

