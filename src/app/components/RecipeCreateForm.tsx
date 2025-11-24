"use client";

import { useState, useMemo } from "react";
import { computeIngredientUsageCostWithDensity, BaseUnit, Unit } from "@/lib/units";
import { RecipeFormHeader } from "./recipe-form/RecipeFormHeader";
import { RecipeFormDetails } from "./recipe-form/RecipeFormDetails";
import { RecipeFormIngredients } from "./recipe-form/RecipeFormIngredients";
import { RecipeFormInstructions } from "./recipe-form/RecipeFormInstructions";
import { RecipeFormCostBreakdown } from "./recipe-form/RecipeFormCostBreakdown";
import { logger } from "@/lib/logger";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  originalUnit?: string | null;
  packPrice: number;
  densityGPerMl?: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface ShelfLifeOption {
  id: number;
  name: string;
}

interface StorageOption {
  id: number;
  name: string;
}

interface RecipeItem {
  id: string;
  ingredientId: number;
  quantity: string;
  unit: Unit;
  note?: string;
}

interface RecipeSection {
  id: string;
  title: string;
  description?: string;
  method?: string;
  bakeTemp?: string;
  bakeTime?: string;
  items: RecipeItem[];
}

interface RecipeCreateFormProps {
  ingredients: Ingredient[];
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
  onSubmit: (data: FormData) => Promise<void>;
}

export function RecipeCreateForm({
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSubmit,
}: RecipeCreateFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Recipe fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [method, setMethod] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState(1);
  const [yieldUnit, setYieldUnit] = useState("each");
  const [categoryId, setCategoryId] = useState("");
  const [shelfLifeId, setShelfLifeId] = useState("");
  const [storageId, setStorageId] = useState("");
  const [bakeTime, setBakeTime] = useState("");
  const [bakeTemp, setBakeTemp] = useState("");
  
  // Wholesale product state
  const [isWholesaleProduct, setIsWholesaleProduct] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState("");
  
  // Sections vs simple items
  const [useSections, setUseSections] = useState(false);
  const [sections, setSections] = useState<RecipeSection[]>([
    { id: "section-0", title: "Step 1", description: "", method: "", bakeTemp: "", bakeTime: "", items: [] }
  ]);
  
  const [items, setItems] = useState<RecipeItem[]>([
    { id: `item-0`, ingredientId: 0, quantity: "0", unit: "g" as Unit, note: "" }
  ]);

  const totalCost = useMemo(() => {
    let total = 0;
    const itemsToCalc = useSections 
      ? sections.flatMap(s => s.items)
      : items;

    itemsToCalc.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient && item.quantity && parseFloat(item.quantity) > 0) {
        const cost = computeIngredientUsageCostWithDensity({
          usageQuantity: parseFloat(item.quantity) || 0,
          usageUnit: item.unit,
          ingredient: {
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit as BaseUnit,
            packPrice: ingredient.packPrice,
            densityGPerMl: ingredient.densityGPerMl || undefined,
            name: ingredient.name,
          }
        });
        total += cost;
      }
    });
    return total;
  }, [useSections, sections, items, ingredients]);

  const costPerUnit = useMemo(() => 
    yieldQuantity > 0 ? totalCost / yieldQuantity : 0,
    [totalCost, yieldQuantity]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validation
      if (!name || name.trim() === "") {
        alert("Please enter a recipe name.");
        setIsSaving(false);
        return;
      }

      if (!yieldQuantity || yieldQuantity <= 0) {
        alert("Please enter a valid yield quantity greater than 0.");
        setIsSaving(false);
        return;
      }

      const hasIngredients = useSections 
        ? sections.some(s => s.items.length > 0 && s.items.some(item => item.ingredientId && parseFloat(item.quantity) > 0))
        : items.length > 0 && items.some(item => item.ingredientId && parseFloat(item.quantity) > 0);

      if (!hasIngredients) {
        alert("Please add at least one ingredient with a valid quantity.");
        setIsSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description);
      formData.append("yieldQuantity", yieldQuantity.toString());
      formData.append("yieldUnit", yieldUnit);
      formData.append("method", method);
      formData.append("imageUrl", imageUrl);
      
      const recipeType = yieldUnit === "each" && yieldQuantity === 1 ? "single" : "batch";
      formData.append("recipeType", recipeType);
      formData.append("servings", yieldQuantity.toString());
      
      if (categoryId) formData.append("categoryId", categoryId.toString());
      if (shelfLifeId) formData.append("shelfLifeId", shelfLifeId.toString());
      if (storageId) formData.append("storageId", storageId.toString());
      if (bakeTime) formData.append("bakeTime", bakeTime.toString());
      if (bakeTemp) formData.append("bakeTemp", bakeTemp.toString());

      // Wholesale product data
      if (isWholesaleProduct) {
        formData.append("isWholesaleProduct", "on");
        if (wholesalePrice) formData.append("wholesalePrice", wholesalePrice);
      }

      formData.append("useSections", useSections.toString());

      if (useSections) {
        formData.append("sections", JSON.stringify(sections));
      } else {
        formData.append("recipeItems", JSON.stringify(items));
      }

      await onSubmit(formData);
    } catch (error) {
      logger.error("Error creating recipe", error, "RecipeCreateForm");
      alert("Failed to create recipe. Please check the console for details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
                      setUploading(true);
                      setUploadError("");
                      
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                        const data = await res.json();
                        
                        if (res.ok) {
                          setImageUrl(data.url);
                        } else {
                          setUploadError(data.error || "Upload failed");
                        }
                      } catch (error) {
                        setUploadError("Network error. Please try again.");
      logger.error("Image upload failed", error, "RecipeCreateForm");
                      } finally {
                        setUploading(false);
                      }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <RecipeFormHeader
        name={name}
        description={description}
        yieldQuantity={yieldQuantity}
        yieldUnit={yieldUnit}
        totalCost={totalCost}
        costPerUnit={costPerUnit}
        imageUrl={imageUrl}
        uploading={uploading}
        uploadError={uploadError}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onYieldQuantityChange={setYieldQuantity}
        onYieldUnitChange={setYieldUnit}
        onImageChange={handleImageUpload}
        onRecipeTypeChange={(type) => {
          if (type === "single") {
            setYieldUnit("each");
            setYieldQuantity(1);
                      } else {
            setYieldUnit("each");
            setYieldQuantity(4);
          }
        }}
      />

      {/* Main Grid */}
      <div className="grid xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Details */}
        <div className="xl:col-span-2 space-y-6">
          <RecipeFormDetails
            categories={categories}
            shelfLifeOptions={shelfLifeOptions}
            storageOptions={storageOptions}
            categoryId={categoryId}
            shelfLifeId={shelfLifeId}
            storageId={storageId}
            bakeTime={bakeTime}
            bakeTemp={bakeTemp}
            useSections={useSections}
            isWholesaleProduct={isWholesaleProduct}
            wholesalePrice={wholesalePrice}
            yieldUnit={yieldUnit}
            onCategoryChange={setCategoryId}
            onShelfLifeChange={setShelfLifeId}
            onStorageChange={setStorageId}
            onBakeTimeChange={setBakeTime}
            onBakeTempChange={setBakeTemp}
            onWholesaleToggle={setIsWholesaleProduct}
            onWholesalePriceChange={setWholesalePrice}
          />
        </div>

        {/* Main Content */}
        <div className="xl:col-span-7">
          <div className="space-y-6">
            <RecipeFormIngredients
              ingredients={ingredients}
              useSections={useSections}
              items={items}
              sections={sections}
              onUseSectionsChange={(checked) => {
                if (checked && items.length > 0) {
                        setSections([{
                          id: "section-0",
                          title: "Step 1",
                          description: "",
                          method: "",
                          bakeTemp: "",
                          bakeTime: "",
                          items: [...items],
                        }]);
                } else if (!checked && sections.length > 0 && sections[0].items.length > 0) {
                        setItems([...sections[0].items]);
                      }
                setUseSections(checked);
              }}
              onItemsChange={setItems}
              onSectionsChange={setSections}
            />

            <RecipeFormInstructions
              method={method}
              useSections={useSections}
              onMethodChange={setMethod}
            />

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Recipe...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Recipe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Cost Breakdown */}
        <div className="xl:col-span-3">
          <RecipeFormCostBreakdown
            totalCost={totalCost}
            costPerUnit={costPerUnit}
          />
        </div>
      </div>
    </div>
  );
}

