"use client";

import { RecipeMock } from "@/lib/mocks/recipe";
import { useState, useMemo } from "react";
import { useServings, useIngredientChecklist } from "@/lib/useLocalChecklist";
import { saveRecipeChanges, saveSellPrice, saveRecipe } from "./actions";
import { computeIngredientUsageCostWithDensity, Unit } from "@/lib/units";
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
import Image from "next/image";

type ViewMode = "whole" | "steps" | "edit" | "photos";

interface Props {
  recipe: RecipeMock;
  categories: { id: number; name: string }[];
  storageOptions: { id: number; name: string }[];
  shelfLifeOptions: { id: number; name: string }[];
  recipeId: number | null;
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
  isNew?: boolean;
}

export default function RecipeRedesignClient({ recipe, categories, storageOptions, shelfLifeOptions, recipeId, availableIngredients, isNew = false }: Props) {
  // Start in edit mode for new recipes, steps mode for existing
  const [viewMode, setViewMode] = useState<ViewMode>(isNew ? "edit" : "steps");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const { servings, setServings } = useServings(recipe.id, recipe.baseServings);
  const checklist = useIngredientChecklist(recipe.id);
  const [localIngredients, setLocalIngredients] = useState(recipe.ingredients);
  const [localSteps, setLocalSteps] = useState(recipe.steps);
  const [recipeTitle, setRecipeTitle] = useState(recipe.title);
  const [recipeType, setRecipeType] = useState<"single" | "batch">("batch");
  const [slicesPerBatch, setSlicesPerBatch] = useState(recipe.baseServings);
  const [category, setCategory] = useState(recipe.category || "Uncategorized");
  const [storage, setStorage] = useState(recipe.storage || "");
  const [shelfLife, setShelfLife] = useState(recipe.shelfLife || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [description, setDescription] = useState(recipe.notes || "");
  
  // Calculate cost properly with unit conversion
  const calculateIngredientCost = useMemo(() => {
    return (ingredient: typeof localIngredients[0]) => {
      const fullIngredient = availableIngredients.find(ai => ai.name === ingredient.name);
      if (!fullIngredient || !ingredient.quantity) return 0;
      
      return computeIngredientUsageCostWithDensity(
        ingredient.quantity,
        ingredient.unit as Unit,
        fullIngredient.packPrice,
        fullIngredient.packQuantity,
        fullIngredient.packUnit as Unit,
        fullIngredient.densityGPerMl || undefined
      );
    };
  }, [availableIngredients]);

  // Calculate total cost properly with unit conversion
  const totalCost = useMemo(() => {
    return localIngredients.reduce((sum, ing) => {
      return sum + calculateIngredientCost(ing);
    }, 0);
  }, [localIngredients, calculateIngredientCost]);
  
  const [sellPrice, setSellPrice] = useState(recipe.sellPrice || (totalCost * 3));

  // Collect allergens from ingredients
  const allergens = useMemo(() => {
    const allergenSet = new Set<string>();
    localIngredients.forEach(ing => {
      // Find the ingredient in availableIngredients to get its allergens
      const fullIngredient = availableIngredients.find(ai => ai.name === ing.name);
      if (fullIngredient && fullIngredient.allergens) {
        fullIngredient.allergens.forEach((allergen: string) => allergenSet.add(allergen));
      }
    });
    return Array.from(allergenSet).sort();
  }, [localIngredients, availableIngredients]);

  // Detect dietary labels based on allergens
  const dietaryLabels = useMemo(() => {
    const labels: string[] = [];
    
    // Gluten-free check
    if (!allergens.includes("Gluten")) {
      labels.push("Made without gluten");
    }
    
    // Dairy-free check
    if (!allergens.includes("Milk")) {
      labels.push("Dairy-free");
    }
    
    // Vegan check (no animal products)
    const animalProducts = ["Eggs", "Milk", "Fish", "Molluscs"];
    const hasAnimalProducts = allergens.some(a => animalProducts.includes(a));
    if (!hasAnimalProducts) {
      labels.push("Vegan");
    }
    
    // Vegetarian check (no meat/fish, but may have eggs/dairy)
    const meatFish = ["Fish", "Molluscs"];
    const hasMeatFish = allergens.some(a => meatFish.includes(a));
    if (!hasMeatFish) {
      labels.push("Vegetarian");
    }
    
    // Nut-free check
    const nutAllergens = allergens.filter(a => 
      a.includes("nut") || 
      a.includes("Nut") || 
      a === "Peanuts" || 
      a === "Almonds" || 
      a === "Cashews" ||
      a === "Hazelnuts" ||
      a === "Walnuts" ||
      a === "Pistachios" ||
      a === "Pecans" ||
      a === "Macadamia nuts" ||
      a === "Pine nuts" ||
      a === "Brazil nuts"
    );
    if (nutAllergens.length === 0) {
      labels.push("Nut-free");
    }
    
    // Soy-free check
    if (!allergens.includes("Soya")) {
      labels.push("Soy-free");
    }
    
    return labels;
  }, [allergens]);

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
      // Validation
      if (!recipeTitle || recipeTitle.trim() === "") {
        alert("❌ Please enter a recipe name");
        setIsSaving(false);
        return;
      }

      if (isNew) {
        // Create new recipe
        const result = await saveRecipe({
          recipeId: null,
          name: recipeTitle.trim(),
          yieldQuantity: servings,
          yieldUnit: recipeType === "batch" ? "slices" : "each",
          category,
          storage,
          shelfLife,
          sellPrice,
          description,
          ingredients: localIngredients,
          steps: localSteps,
        });

        if (result.success && result.recipeId) {
          // Redirect to the new recipe page
          window.location.href = `/dashboard/recipes/${result.recipeId}`;
        } else {
          alert("❌ Failed to create recipe: " + (result.error || "Unknown error"));
        }
      } else {
        // Update existing recipe
        const result = await saveRecipeChanges({
          recipeId: recipeId!,
          category,
          storage,
          shelfLife,
          sellPrice,
          description,
          ingredients: localIngredients,
          steps: localSteps,
        });

        if (result.success) {
          // Switch back to steps view after saving
          setViewMode("steps");
        } else {
          alert("❌ Failed to save changes: " + (result.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintAllergenSheet = () => {
    // Create a printable window
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Allergen Information - ${recipe.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1f2937; border-bottom: 3px solid #10b981; padding-bottom: 10px; margin-bottom: 5px; }
            h2 { color: #374151; margin-top: 30px; }
            .header { text-align: center; margin-bottom: 40px; }
            .header img { max-width: 200px; max-height: 200px; border-radius: 8px; margin: 20px auto; display: block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .section { margin: 20px 0; padding: 15px; border-left: 4px solid #e5e7eb; }
            .allergen-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; margin: 4px; border-radius: 4px; font-size: 14px; }
            .dietary-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 4px 12px; margin: 4px; border-radius: 4px; font-size: 14px; }
            .description { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.6; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .cross-contamination { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; font-size: 13px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${recipe.title}</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Allergen Information Sheet</p>
            ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}" onerror="this.style.display='none'" />` : ''}
          </div>
          
          ${description ? `
            <div class="section">
              <h2>Product Description</h2>
              <div class="description">${description.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}
          
          ${allergens.length > 0 ? `
            <div class="section">
              <h2>⚠️ Contains Allergens</h2>
              <div class="warning">
                <strong>Warning:</strong> This product contains the following allergens:
              </div>
              <div style="margin-top: 15px;">
                ${allergens.map(a => `<span class="allergen-badge">${a}</span>`).join('')}
              </div>
              <p style="margin-top: 15px; font-size: 14px; color: #6b7280;">
                Please ensure customers with allergies are informed before consumption.
              </p>
            </div>
          ` : `
            <div class="section">
              <h2>✓ No Common Allergens Detected</h2>
              <p style="color: #059669;">This product does not contain any of the 14 major allergens.</p>
            </div>
          `}
          
          <div class="cross-contamination">
            <strong>⚠️ Cross-Contamination Warning:</strong><br>
            This product is prepared in a kitchen that handles all 14 major allergens including cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, and molluscs. While we take precautions to prevent cross-contact, we cannot guarantee that any product is completely free from allergens.
          </div>
          
          ${dietaryLabels.length > 0 ? `
            <div class="section">
              <h2>✓ Dietary Information</h2>
              <p style="margin-bottom: 10px;">This product is suitable for:</p>
              <div>
                ${dietaryLabels.map(l => `<span class="dietary-badge">✓ ${l}</span>`).join('')}
              </div>
              <p style="margin-top: 15px; font-size: 14px; color: #6b7280; font-style: italic;">
                Auto-detected from ingredient allergen data.
              </p>
            </div>
          ` : ''}
          
          ${storage || shelfLife ? `
            <div class="section">
              <h2>Storage & Shelf Life</h2>
              ${storage ? `<p><strong>Storage:</strong> ${storage}</p>` : ''}
              ${shelfLife ? `<p><strong>Shelf Life:</strong> ${shelfLife}</p>` : ''}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>This information is based on ingredient data and should be verified before distribution.</p>
            <p style="margin-top: 10px; font-size: 11px;">Always inform customers of potential allergen risks.</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Print This Sheet
            </button>
            <button onclick="window.close()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                title={isNew ? recipeTitle || "New Recipe" : recipe.title}
                category={category}
                servings={servings}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCategoryChange={setCategory}
                onSave={handleSave}
                isSaving={isSaving}
                categories={categories}
                imageUrl={recipe.imageUrl}
                onTitleChange={isNew ? setRecipeTitle : undefined}
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

          {/* Photos View - Compact Layout */}
          {viewMode === "photos" && (
            <div className="mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {/* Recipe Image - Left Side */}
                  <div className="flex-shrink-0">
                    <div className="aspect-[3/4] bg-gradient-to-br from-emerald-100 to-blue-100 relative overflow-hidden rounded-xl">
                      <Image
                        src={recipe.imageUrl || "/images/placeholder-cake.png"}
                        alt={isNew ? recipeTitle || "New Recipe" : recipe.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>

                  {/* Content - Right Side */}
                  <div className="flex flex-col gap-6">
                    {/* Recipe Title & Info */}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{isNew ? recipeTitle || "New Recipe" : recipe.title}</h1>
                      <div className="flex items-center gap-3 text-gray-600 mb-3">
                        <span>{recipe.category || "Uncategorized"}</span>
                        <span>•</span>
                        <span>{servings} servings</span>
                        {recipe.sellPrice && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600">£{recipe.sellPrice.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      {recipe.description && (
                        <p className="text-gray-700 leading-relaxed">
                          {recipe.description}
                        </p>
                      )}
                    </div>

                    {/* Ingredients */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {localIngredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-700">{ingredient.name}</span>
                            <span className="text-sm text-gray-500">{ingredient.quantity} {ingredient.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions/Method */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Method</h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {localSteps.map((step, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{step.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients & Instructions - Main Content */}
          {viewMode !== "photos" && (
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
          )}
        </div>
      </div>

      {/* Bottom Info Bar - Separate Container Cards - FIXED TO BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t-2 border-gray-200 py-1.5 z-30 pl-4 md:pl-16 lg:pl-20 xl:pl-24">
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
                  <span className="text-base font-bold text-emerald-600">£{(totalCost * (servings / recipe.baseServings)).toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Per Slice</span>
                  <span className="text-base font-semibold text-gray-900">£{((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)).toFixed(2)}</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">COGS</span>
                  <span className={`text-base font-bold ${
                    ((((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 25 ? 'text-emerald-600' :
                    ((((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 33 ? 'text-green-600' :
                    ((((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100) <= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {sellPrice > 0 ? `${((((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings)) / sellPrice) * 100).toFixed(1)}%` : 'N/A'}
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
                  <div className="h-4 w-px bg-gray-300" />
                  <button
                    onClick={() => setIsDescriptionModalOpen(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    title={description ? "Edit product description" : "Add product description"}
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      {description ? "Description" : "Add Description"}
                    </span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Allergens with list */}
                    {allergens && allergens.length > 0 && (
                      <div className="flex items-center gap-1.5" title={allergens.join(", ")}>
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex flex-wrap gap-1">
                          {allergens.slice(0, 3).map((allergen, idx) => (
                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {allergen}
                            </span>
                          ))}
                          {allergens.length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              +{allergens.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Dietary Labels */}
                    {dietaryLabels.length > 0 && (
                      <>
                        {allergens && allergens.length > 0 && <div className="h-4 w-px bg-gray-300" />}
                        <div className="flex flex-wrap gap-1">
                          {dietaryLabels.slice(0, 3).map((label, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ {label}
                            </span>
                          ))}
                          {dietaryLabels.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +{dietaryLabels.length - 3}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    
               {/* Info Button */}
               {(allergens.length > 0 || dietaryLabels.length > 0) && (
                 <button
                   onClick={() => setIsAllergenModalOpen(true)}
                   className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600"
                   title="View detailed allergen and dietary information"
                 >
                   <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </button>
               )}
                    
                    {storage && (
                      <>
                        {(allergens?.length > 0 || dietaryLabels.length > 0) && <div className="h-4 w-px bg-gray-300" />}
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
                        {(storage || allergens?.length > 0 || dietaryLabels.length > 0) && <div className="h-4 w-px bg-gray-300" />}
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-700">{shelfLife}</span>
                        </div>
                      </>
                    )}
                    
                    {/* Description Button */}
                    {(allergens?.length > 0 || dietaryLabels.length > 0 || storage || shelfLife) && <div className="h-4 w-px bg-gray-300" />}
                    <button
                      onClick={() => setIsDescriptionModalOpen(true)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      title={description ? "View product description" : "Add product description"}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">
                        {description ? "Description" : "Add Description"}
                      </span>
                    </button>
                    
                    {!allergens?.length && !dietaryLabels.length && !storage && !shelfLife && !description && (
                      <span className="text-xs text-gray-400 italic">No metadata available</span>
                    )}
                  </div>
                  
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
        totalCost={(totalCost * (servings / recipe.baseServings))}
        costPerServing={((totalCost * (servings / recipe.baseServings)) / (recipeType === "batch" ? slicesPerBatch : servings))}
        recipeType={recipeType}
        slicesPerBatch={slicesPerBatch}
        sellPrice={sellPrice}
        onSellPriceChange={setSellPrice}
        recipeId={recipeId}
        onSave={async (price: number) => {
          await saveSellPrice(recipeId, price);
        }}
      />

      {/* Description Modal */}
      {isDescriptionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-white/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDescriptionModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Product Description</h2>
                <button
                  onClick={() => setIsDescriptionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {viewMode === "edit" ? (
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description for Wholesalers
                      <span className="text-xs text-gray-500 font-normal ml-2">
                        (This will appear on printed allergen sheets)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      placeholder="Enter a description of this product for wholesalers. Include key selling points, texture, flavor profile, or any special notes..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Tip: A good description helps wholesalers understand and sell your product better.
                    </p>
                  </div>
                ) : (
                  <div>
                    {description ? (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{description}</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No description added yet</p>
                        <p className="text-xs mt-1">Switch to edit mode to add a product description</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsDescriptionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                {viewMode === "edit" && (
                  <button
                    onClick={() => {
                      setIsDescriptionModalOpen(false);
                      // Description is already saved in state, will be saved when user clicks main Save button
                    }}
                    className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allergen Information Modal */}
      {isAllergenModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-white/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAllergenModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-3xl bg-white rounded-lg shadow-2xl border border-gray-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Allergen & Dietary Information</h2>
                <button
                  onClick={() => setIsAllergenModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Allergens Section */}
                {allergens.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Allergens ({allergens.length})</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {allergens.map((allergen, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                          {allergen}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      Contains allergens from ingredients. Please inform customers with allergies.
                    </p>
                  </div>
                )}

                {/* Dietary Labels Section */}
                {dietaryLabels.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Dietary Classifications</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {dietaryLabels.map((label, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          ✓ {label}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      Auto-detected from ingredient allergen data. Suitable for customers with these dietary preferences.
                    </p>
                  </div>
                )}

                {/* Cross-Contamination Warning */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">Cross-Contamination Warning</h4>
                      <p className="text-sm text-red-800 leading-relaxed">
                        This product is prepared in a kitchen that handles all 14 major allergens including cereals containing gluten, crustaceans, eggs, fish, peanuts, soybeans, milk, nuts, celery, mustard, sesame, sulphites, lupin, and molluscs. While we take precautions to prevent cross-contact, we cannot guarantee that any product is completely free from allergens.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(storage || shelfLife) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Storage & Shelf Life</h4>
                    {storage && <p className="text-sm text-gray-700 mb-1"><strong>Storage:</strong> {storage}</p>}
                    {shelfLife && <p className="text-sm text-gray-700"><strong>Shelf Life:</strong> {shelfLife}</p>}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsAllergenModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintAllergenSheet}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Allergen Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

