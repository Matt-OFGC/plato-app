"use client";

import { RecipeMock } from "@/app/lib/mocks/recipe";
import { useState } from "react";
import { useServings, useIngredientChecklist } from "@/app/lib/useLocalChecklist";
import RecipeHeader from "./components/RecipeHeader";
import RecipeImage from "./components/RecipeImage";
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
}

export default function RecipeRedesignClient({ recipe }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("steps");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { servings, setServings } = useServings(recipe.id, recipe.baseServings);
  const checklist = useIngredientChecklist(recipe.id);
  const [localIngredients, setLocalIngredients] = useState(recipe.ingredients);
  const [localSteps, setLocalSteps] = useState(recipe.steps);
  const [recipeType, setRecipeType] = useState<"single" | "batch">("batch");
  const [slicesPerBatch, setSlicesPerBatch] = useState(recipe.baseServings);
  const [category, setCategory] = useState(recipe.category || "Uncategorized");

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Back Button + Header on same line */}
        <div className="flex items-center gap-3 mb-6">
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
            />
          </div>
        </div>

        {/* Main Content Grid - Adjust left rail width based on view mode */}
        <div className={`grid grid-cols-1 gap-6 ${
          viewMode === "edit" ? "lg:grid-cols-[140px_1fr]" : "lg:grid-cols-[200px_1fr]"
        }`}>
          {/* Left Rail */}
          <div className="space-y-4">
            <RecipeImage
              imageUrl={recipe.imageUrl}
              title={recipe.title}
              isEditMode={viewMode === "edit"}
            />
            
            {/* Show Servings Control in view modes, Recipe Type in edit mode */}
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
            
            <CostAnalysis
              recipe={recipe}
              servings={servings}
              baseServings={recipe.baseServings}
              recipeType={recipeType}
              slicesPerBatch={slicesPerBatch}
            />
            
            <RecipeMetadata
              allergens={recipe.allergens}
              storage={recipe.storage}
              shelfLife={recipe.shelfLife}
            />
            
            <RecipeNotes notes={recipe.notes} />
          </div>

          {/* Right Content Area */}
          <div className="space-y-4">
            {/* Step Navigation - Show in Steps and Edit modes */}
            {(viewMode === "steps" || viewMode === "edit") && localSteps.length > 0 && (
              <StepNavigation
                steps={localSteps}
                activeStepIndex={activeStepIndex}
                onStepChange={setActiveStepIndex}
                totalSteps={localSteps.length}
              />
            )}

            {/* Two Column Layout for Ingredients & Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}

