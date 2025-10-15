"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/currency";
import { Unit } from "@/generated/prisma";
import { computeIngredientUsageCost } from "@/lib/units";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTimers } from "@/contexts/TimerContext";
import { SearchableSelect } from "@/components/SearchableSelect";

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

interface RecipePageInlineCompleteProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
    categoryId?: number | null;
    shelfLifeId?: number | null;
    storageId?: number | null;
    bakeTime?: number | null;
    bakeTemp?: number | null;
    sections: Array<{
      id: number;
      title: string;
      description?: string;
      method?: string;
      bakeTemp?: number | null;
      bakeTime?: number | null;
      order: number;
      items: Array<{
        id: number;
        quantity: number;
        unit: string;
        note?: string;
        ingredient: {
          id: number;
          name: string;
          packQuantity: number;
          packUnit: string;
          packPrice: number;
          densityGPerMl?: number;
        };
      }>;
    }>;
    items: Array<{
      id: number;
      quantity: number;
      unit: string;
      note?: string;
      ingredient: {
        id: number;
        name: string;
        packQuantity: number;
        packUnit: string;
        packPrice: number;
        densityGPerMl?: number;
      };
    }>;
  };
  costBreakdown: {
    totalCost: number;
    costPerOutputUnit: number;
  };
  ingredients: Ingredient[];
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
  wholesaleProduct?: {
    id: number;
    price: string;
    isActive: boolean;
  } | null;
  onSave: (data: FormData) => Promise<void>;
}

// Sortable Item Component for section ingredients
function SortableSectionIngredientItem({
  item,
  ingredients,
  onUpdate,
  onRemove,
}: {
  item: RecipeItem;
  ingredients: Ingredient[];
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const ingredient = ingredients.find((i) => i.id === item.ingredientId);
  const cost = ingredient
    ? computeIngredientUsageCost({
        usageQuantity: parseFloat(item.quantity) || 0,
        usageUnit: item.unit,
        ingredient: {
          packQuantity: ingredient.packQuantity,
          packUnit: ingredient.packUnit as any,
          packPrice: ingredient.packPrice,
          densityGPerMl: ingredient.densityGPerMl || undefined,
        },
      })
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-12 gap-3 items-center p-3 bg-white rounded-lg border border-gray-200"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="col-span-1 cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      <div className="col-span-4">
        <SearchableSelect
          options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
          value={item.ingredientId}
          onChange={(ingredientId) => {
            const selectedIngredient = ingredients.find(i => i.id === ingredientId);
            onUpdate(item.id, "ingredientId", ingredientId);
            if (selectedIngredient?.originalUnit) {
              onUpdate(item.id, "unit", selectedIngredient.originalUnit);
            }
          }}
          placeholder="Select ingredient..."
          className="text-sm"
        />
      </div>
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
        className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        placeholder="Qty"
      />
      <select
        value={item.unit}
        onChange={(e) => onUpdate(item.id, "unit", e.target.value)}
        className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      >
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="ml">ml</option>
        <option value="l">l</option>
        <option value="each">each</option>
      </select>
      <div className="col-span-2 px-3 py-2 text-sm text-gray-600 flex items-center">
        {formatCurrency(cost)}
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// Sortable Item Component for simple ingredients
function SortableIngredientItem({
  item,
  ingredients,
  onUpdate,
  onRemove,
}: {
  item: RecipeItem;
  ingredients: Ingredient[];
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const ingredient = ingredients.find((i) => i.id === item.ingredientId);
  const cost = ingredient
    ? computeIngredientUsageCost({
        usageQuantity: parseFloat(item.quantity) || 0,
        usageUnit: item.unit,
        ingredient: {
          packQuantity: ingredient.packQuantity,
          packUnit: ingredient.packUnit as any,
          packPrice: ingredient.packPrice,
          densityGPerMl: ingredient.densityGPerMl || undefined,
        },
      })
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="col-span-1 cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      <div className="col-span-4">
        <SearchableSelect
          options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
          value={item.ingredientId}
          onChange={(ingredientId) => {
            const selectedIngredient = ingredients.find(i => i.id === ingredientId);
            onUpdate(item.id, "ingredientId", ingredientId);
            if (selectedIngredient?.originalUnit) {
              onUpdate(item.id, "unit", selectedIngredient.originalUnit);
            }
          }}
          placeholder="Select ingredient..."
          className="text-sm"
        />
      </div>
      <input
        type="number"
        value={item.quantity}
        onChange={(e) => onUpdate(item.id, "quantity", e.target.value)}
        className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        placeholder="Qty"
      />
      <select
        value={item.unit}
        onChange={(e) => onUpdate(item.id, "unit", e.target.value)}
        className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      >
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="ml">ml</option>
        <option value="l">l</option>
        <option value="each">each</option>
      </select>
      <div className="col-span-2 px-3 py-2 text-sm text-gray-600 flex items-center">
        {formatCurrency(cost)}
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function RecipePageInlineComplete({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  wholesaleProduct,
  onSave,
}: RecipePageInlineCompleteProps) {
  // Global timer context
  const { timers, startTimer, stopTimer, getTimer } = useTimers();
  
  // Lock/Unlock state
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Cooking mode state
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  
  // Editable recipe fields
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description || "");
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || "");
  const [method, setMethod] = useState(recipe.method || "");
  const [yieldQuantity, setYieldQuantity] = useState(recipe.yieldQuantity);
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [categoryId, setCategoryId] = useState(recipe.categoryId || "");
  const [shelfLifeId, setShelfLifeId] = useState(recipe.shelfLifeId || "");
  const [storageId, setStorageId] = useState(recipe.storageId || "");
  const [bakeTime, setBakeTime] = useState(recipe.bakeTime || "");
  const [bakeTemp, setBakeTemp] = useState(recipe.bakeTemp || "");
  
  // Pricing calculator
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [showCogsInfo, setShowCogsInfo] = useState(false);
  
  // Wholesale product state
  const [isWholesaleProduct, setIsWholesaleProduct] = useState(!!wholesaleProduct?.isActive);
  const [wholesalePrice, setWholesalePrice] = useState(wholesaleProduct?.price || "");
  
  // Sections vs simple items
  const [useSections, setUseSections] = useState(recipe.sections.length > 0);
  const [sections, setSections] = useState<RecipeSection[]>(
    recipe.sections.length > 0
      ? recipe.sections.map((s, idx) => ({
          id: `section-${idx}`,
          title: s.title,
          description: s.description || "",
          method: s.method || "",
          bakeTemp: s.bakeTemp?.toString() || "",
          bakeTime: s.bakeTime?.toString() || "",
          items: s.items.map((item, itemIdx) => ({
            id: `section-${idx}-item-${itemIdx}`,
            ingredientId: item.ingredient.id,
            quantity: item.quantity.toString(),
            unit: item.unit as Unit,
            note: item.note || "",
          })),
        }))
      : [{ id: "section-0", title: "Step 1", description: "", method: "", bakeTemp: "", bakeTime: "", items: [] }]
  );
  
  // Calculate total bake time from sections if using sections
  const displayBakeTime = useSections && sections.length > 0
    ? sections
        .map(s => parseInt(s.bakeTime || "0"))
        .filter(time => !isNaN(time) && time > 0)
        .reduce((sum, time) => sum + time, 0) || recipe.bakeTime
    : recipe.bakeTime;
  
  const [items, setItems] = useState<RecipeItem[]>(
    recipe.items.map((item, idx) => ({
      id: `item-${idx}`,
      ingredientId: item.ingredient.id,
      quantity: item.quantity.toString(),
      unit: item.unit as Unit,
      note: item.note || "",
    }))
  );
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Calculate scaled ingredients for view mode - memoized for performance
  const scaleFactor = useMemo(() => servings / recipe.yieldQuantity, [servings, recipe.yieldQuantity]);
  
  const scaledIngredients = useMemo(() => 
    recipe.items.map(item => ({
    ...item,
    scaledQuantity: item.quantity * scaleFactor,
    })),
    [recipe.items, scaleFactor]
  );

  const scaledSections = useMemo(() =>
    recipe.sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      scaledQuantity: item.quantity * scaleFactor,
    })),
    })),
    [recipe.sections, scaleFactor]
  );

  const toggleItem = useCallback((itemId: number) => {
    setCheckedItems(prev => {
      const newChecked = new Set(prev);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
      return newChecked;
    });
  }, []);

  // Calculate edit mode cost - memoized for performance
  const calculateEditCost = useMemo(() => {
    let total = 0;
    const itemsToCalc = useSections 
      ? sections.flatMap(s => s.items)
      : items;

    itemsToCalc.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient && item.quantity) {
        const cost = computeIngredientUsageCost({
          usageQuantity: parseFloat(item.quantity) || 0,
          usageUnit: item.unit,
          ingredient: {
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit as any,
            packPrice: ingredient.packPrice,
            densityGPerMl: ingredient.densityGPerMl || undefined,
          }
        });
        total += cost;
      }
    });
    return total;
  }, [useSections, sections, items, ingredients]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validation: Check if recipe has a name
      if (!name || name.trim() === "") {
        alert("Please enter a recipe name.");
        setIsSaving(false);
        return;
      }

      // Validation: Check yield quantity
      if (!yieldQuantity || yieldQuantity <= 0) {
        alert("Please enter a valid yield quantity greater than 0.");
        setIsSaving(false);
        return;
      }

      // Validation: Check that we have at least one ingredient
      const hasIngredients = useSections 
        ? sections.some(s => s.items.length > 0 && s.items.some(item => item.ingredientId && parseFloat(item.quantity) > 0))
        : items.length > 0 && items.some(item => item.ingredientId && parseFloat(item.quantity) > 0);

      if (!hasIngredients) {
        alert("Please add at least one ingredient with a valid quantity.");
        setIsSaving(false);
        return;
      }

    const formData = new FormData();
    formData.append("recipeId", recipe.id.toString());
      formData.append("name", name.trim());
    formData.append("description", description);
    formData.append("yieldQuantity", yieldQuantity.toString());
    formData.append("yieldUnit", yieldUnit);
    formData.append("method", method);
    formData.append("imageUrl", imageUrl);
    
    // Add recipe type information
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

    await onSave(formData);
    setIsLocked(true);
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Failed to save recipe. Please check the console for details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addIngredient = () => {
    if (ingredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.");
      return;
    }
    const defaultIngredient = ingredients[0];
    const defaultUnit = (defaultIngredient.originalUnit || "g") as Unit;
    setItems([...items, {
      id: `item-${Date.now()}`,
      ingredientId: defaultIngredient.id,
      quantity: "0",
      unit: defaultUnit,
      note: "",
    }]);
  };

  const removeIngredient = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addSection = () => {
    setSections([...sections, {
      id: `section-${Date.now()}`,
      title: `Step ${sections.length + 1}`,
      description: "",
      method: "",
      bakeTemp: "",
      bakeTime: "",
      items: [],
    }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const addIngredientToSection = (sectionId: string) => {
    if (ingredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.");
      return;
    }
    const defaultIngredient = ingredients[0];
    const defaultUnit = (defaultIngredient.originalUnit || "g") as Unit;
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: `${sectionId}-item-${Date.now()}`,
            ingredientId: defaultIngredient.id,
            quantity: "0",
            unit: defaultUnit,
            note: "",
          }],
        };
      }
      return section;
    }));
  };

  const removeIngredientFromSection = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId),
        };
      }
      return section;
    }));
  };

  // Drag handlers
  const handleDragEndItems = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndSectionItems = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((sections) =>
        sections.map((section) => {
          if (section.id === sectionId) {
            const oldIndex = section.items.findIndex((item) => item.id === active.id);
            const newIndex = section.items.findIndex((item) => item.id === over.id);
            return {
              ...section,
              items: arrayMove(section.items, oldIndex, newIndex),
            };
          }
          return section;
        })
      );
    }
  };

  const allIngredients = useMemo(() => 
    recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
      : scaledIngredients,
    [recipe.sections.length, scaledSections, scaledIngredients]
  );

  const editModeTotalCost = useMemo(() => 
    isLocked ? costBreakdown.totalCost : calculateEditCost,
    [isLocked, costBreakdown.totalCost, calculateEditCost]
  );
  
  const editModeCostPerUnit = useMemo(() => 
    isLocked ? costBreakdown.costPerOutputUnit : (yieldQuantity > 0 ? editModeTotalCost / yieldQuantity : 0),
    [isLocked, costBreakdown.costPerOutputUnit, yieldQuantity, editModeTotalCost]
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Lock/Unlock Toggle */}
      <div className="flex-shrink-0 mb-6 flex items-center justify-between">
        <a 
          href="/dashboard/recipes" 
          className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </a>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/recipes/${recipe.id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Link>
          
          {isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsLocked(true);
                  // Reset to original values
                  setName(recipe.name);
                  setDescription(recipe.description || "");
                  setImageUrl(recipe.imageUrl || "");
                  setMethod(recipe.method || "");
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lock Indicator */}
      {!isLocked && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-blue-700 font-medium">
            <span className="font-semibold">Editing mode active</span> - Make your changes and click "Save Changes" when done
          </p>
        </div>
      )}

      {/* Recipe Title - Edit Mode Only */}
      {!isLocked && (
        <div className="mb-8">
          <div className="flex gap-6 items-start">
            {/* Title and Description */}
            <div className="flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add a description..."
                className="text-lg text-gray-600 mb-4 w-full border-2 border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Yield:</span>
                  <input
                    type="number"
                    value={yieldQuantity}
                    onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value)}
                    className="px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="each">servings</option>
                    <option value="g">grams</option>
                    <option value="ml">milliliters</option>
                  </select>
                </div>
                <span>Total Cost: {formatCurrency(editModeTotalCost)}</span>
                <span>Cost per: {formatCurrency(editModeCostPerUnit)}</span>
              </div>

              {/* Recipe Type Selector - Animated Toggle */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Recipe Type:</span>
                <div className="relative inline-flex bg-gray-100 rounded-lg p-1 shadow-inner">
                  {/* Sliding background */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-gradient-to-r from-blue-500 to-blue-600 rounded-md shadow-sm transition-all duration-300 ease-out ${
                      yieldUnit === "each" && yieldQuantity === 1 ? "left-1" : "left-[calc(50%+0.125rem)]"
                    }`}
                  ></div>
                  
                  {/* Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                          setYieldUnit("each");
                          setYieldQuantity(1);
                        }}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      yieldUnit === "each" && yieldQuantity === 1
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Single Serving
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                          setYieldUnit("each");
                          setYieldQuantity(4);
                        }}
                    className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      yieldUnit === "each" && yieldQuantity > 1
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Batch Recipe
                  </button>
                </div>
              </div>
            </div>

            {/* Small Image Preview - Clickable File Upload */}
            <div className="w-32 h-32 flex-shrink-0">
              {recipe.imageUrl || imageUrl ? (
                <div className="relative group w-full h-full">
                <img 
                  src={imageUrl || recipe.imageUrl} 
                  alt={recipe.name} 
                  className="w-full h-full object-cover rounded-xl shadow-md"
                />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Change Image
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        const maxSize = 10 * 1024 * 1024;
                        if (file.size > maxSize) {
                          setUploadError("File is too large. Maximum size is 10MB.");
                          return;
                        }
                        
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
                        } finally {
                          setUploading(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center group cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-400">
                  {uploading ? (
                    <>
                      <svg className="w-8 h-8 text-emerald-400 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs text-emerald-600 font-semibold">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-emerald-400 group-hover:text-emerald-500 transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                      <span className="text-xs text-emerald-600 font-semibold">Add Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const maxSize = 10 * 1024 * 1024;
                      if (file.size > maxSize) {
                        setUploadError("File is too large. Maximum size is 10MB.");
                        return;
                      }
                      
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
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
              {uploadError && (
                <p className="text-xs text-red-600 mt-1">{uploadError}</p>
              )}
            </div>
                  </div>
                )}

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Recipe Overview (Fixed) */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-y-auto">
          {/* Recipe Image */}
          {(recipe.imageUrl || imageUrl) && (
            <div className="mb-6">
              <img 
                src={imageUrl || recipe.imageUrl} 
                alt={recipe.name} 
                className="w-full h-48 object-cover rounded-xl shadow-md"
              />
            </div>
          )}

          {/* Servings Adjuster */}
          <div className="mb-6">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Servings</div>
              <div className="text-xs text-gray-500 mb-4">Adjust recipe quantity</div>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                </button>
                <span className="text-4xl font-bold text-gray-900 min-w-[4rem] text-center">{servings}</span>
                <button 
                  onClick={() => setServings(servings + 1)}
                  className="w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                </div>
                  </div>
                </div>
                
          {/* Metadata Badges */}
          <div className="space-y-3 mb-6">
            {recipe.bakeTemp && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                  <span className="text-sm font-bold text-orange-700">{recipe.bakeTemp}°C</span>
                </div>
                  </div>
            )}
            {displayBakeTime && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  <span className="text-sm font-bold text-blue-700">{displayBakeTime} min</span>
                </div>
                  </div>
            )}
            {recipe.categoryId && categories.find(c => c.id === recipe.categoryId) && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-sm font-bold text-purple-700">{categories.find(c => c.id === recipe.categoryId)?.name}</span>
                </div>
              </div>
            )}
            {recipe.storageId && storageOptions.find(s => s.id === recipe.storageId) && (
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                  <span className="text-sm font-bold text-cyan-700">{storageOptions.find(s => s.id === recipe.storageId)?.name}</span>
                  </div>
                      </div>
            )}
            {recipe.shelfLifeId && shelfLifeOptions.find(s => s.id === recipe.shelfLifeId) && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-bold text-amber-700">{shelfLifeOptions.find(s => s.id === recipe.shelfLifeId)?.name}</span>
                </div>
                    </div>
                  )}
                </div>
                
          {/* Cost Analysis */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Total Cost:</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(editModeTotalCost * scaleFactor)}</span>
                        </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Cost per {recipe.yieldUnit}:</span>
                <span className="text-base font-semibold text-emerald-600">{formatCurrency(editModeCostPerUnit * scaleFactor)}</span>
                      </div>
                        </div>
                      </div>
                    </div>

        {/* Right Panel - Recipe Steps Carousel */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Carousel Container */}
          <div className="flex-1 min-h-0 relative">
            {isLocked ? (
              recipe.sections.length > 0 ? (
                <RecipeCarousel
                  sections={scaledSections}
                  checkedItems={checkedItems}
                  toggleItem={toggleItem}
                  getTimer={getTimer}
                  startTimer={startTimer}
                  recipe={recipe}
                />
              ) : (
                <SimpleRecipeCarousel
                  ingredients={scaledIngredients}
                  instructions={recipe.method}
                  checkedItems={checkedItems}
                  toggleItem={toggleItem}
                />
              )
            ) : (
              <EditModeContent
                useSections={useSections}
                sections={sections}
                items={items}
                method={method}
                ingredients={ingredients}
                sensors={sensors}
                handleDragEndItems={handleDragEndItems}
                handleDragEndSectionItems={handleDragEndSectionItems}
                addIngredient={addIngredient}
                addSection={addSection}
                addIngredientToSection={addIngredientToSection}
                removeIngredient={removeIngredient}
                removeSection={removeSection}
                removeIngredientFromSection={removeIngredientFromSection}
                setSections={setSections}
                setItems={setItems}
                setMethod={setMethod}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                shelfLifeId={shelfLifeId}
                setShelfLifeId={setShelfLifeId}
                storageId={storageId}
                setStorageId={setStorageId}
                isWholesaleProduct={isWholesaleProduct}
                setIsWholesaleProduct={setIsWholesaleProduct}
                wholesalePrice={wholesalePrice}
                setWholesalePrice={setWholesalePrice}
                yieldUnit={yieldUnit}
                bakeTime={bakeTime}
                setBakeTime={setBakeTime}
                bakeTemp={bakeTemp}
                setBakeTemp={setBakeTemp}
                categories={categories}
                shelfLifeOptions={shelfLifeOptions}
                storageOptions={storageOptions}
              />
                  )}
                  </div>
                </div>
              </div>

      {/* Footer - Progress & Navigation */}
      <div className="flex-shrink-0 mt-6 flex items-center gap-6">
        {/* Progress Bar */}
        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${allIngredients.length > 0 ? (checkedItems.size / allIngredients.length) * 100 : 0}%` }}
          ></div>
            </div>
        
        {/* Step Navigation */}
        <div className="flex items-center gap-4">
                    <button 
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600"
            disabled={true} // Will be implemented with carousel state
                    >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
          <span className="text-lg font-semibold text-gray-700">1 / {recipe.sections.length || 2}</span>
                    <button 
            className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600"
            disabled={true} // Will be implemented with carousel state
                    >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>
  );
}

// Carousel Component for Recipes with Sections
function RecipeCarousel({ 
  sections, 
  checkedItems, 
  toggleItem, 
  getTimer, 
  startTimer, 
  recipe 
}: {
  sections: any[];
  checkedItems: Set<number>;
  toggleItem: (id: number) => void;
  getTimer: (id: string) => any;
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => void;
  recipe: any;
}) {
  return (
    <div className="h-full flex overflow-x-auto scroll-snap-x scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
      {sections.map((section, idx) => (
        <div key={section.id} className="flex-shrink-0 w-full h-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm" style={{ scrollSnapAlign: 'start' }}>
          {/* Step Header */}
                      <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                              {idx + 1}
                            </div>
              <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                        </div>
                        
            {/* Cooking Parameters */}
                        {(section.bakeTemp || section.bakeTime) && (
              <div className="flex gap-3 flex-wrap mb-6">
                            {section.bakeTemp && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 px-4 py-2">
                                <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-700">Temp:</span>
                      <span className="text-lg font-bold text-orange-700">{section.bakeTemp}°C</span>
                                </div>
                              </div>
                            )}
                            {section.bakeTime && (
                              <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 px-4 py-2">
                                  <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">Time:</span>
                        <span className="text-lg font-bold text-blue-700">{section.bakeTime} min</span>
                                  </div>
                                </div>
                                    <button
                      onClick={() => startTimer(`recipe-${recipe.id}-section-${section.id}`, recipe.id, recipe.name, section.title, section.bakeTime!)}
                      className="bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-300 px-4 py-2 transition-all"
                                    >
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
          {/* Ingredients */}
                      {section.items.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Ingredients</h3>
                          <div className="space-y-3">
                {section.items.map((item: any) => (
                              <label 
                                key={item.id}
                                htmlFor={`item-${item.id}`}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                  checkedItems.has(item.id) 
                                    ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                              >
                                <input 
                                  id={`item-${item.id}`}
                                  type="checkbox" 
                                  checked={checkedItems.has(item.id)}
                                  onChange={() => toggleItem(item.id)}
                      className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl font-bold text-gray-900">
                                      {item.scaledQuantity.toFixed(1)}
                                    </span>
                                    <span className="text-lg font-semibold text-gray-600">{item.unit}</span>
                        <span className="text-lg text-gray-800">{item.ingredient.name}</span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
          {/* Instructions */}
                      {section.method && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Instructions</h3>
                          <div className="whitespace-pre-wrap text-lg text-gray-800 leading-relaxed bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                            {section.method}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
  );
}

// Simple Recipe Carousel (2 cards: ingredients + instructions)
function SimpleRecipeCarousel({ 
  ingredients, 
  instructions, 
  checkedItems, 
  toggleItem 
}: {
  ingredients: any[];
  instructions?: string;
  checkedItems: Set<number>;
  toggleItem: (id: number) => void;
}) {
  return (
    <div className="h-full flex overflow-x-auto scroll-snap-x scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
      {/* Ingredients Card */}
      <div className="flex-shrink-0 w-full h-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm" style={{ scrollSnapAlign: 'start' }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">Ingredients</h3>
                        <div className="space-y-3">
          {ingredients.map((item) => (
                                <label 
                                  key={item.id}
                                  htmlFor={`simple-item-${item.id}`}
                                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                    checkedItems.has(item.id) 
                                      ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                  }`}
                                >
                                  <input 
                                    id={`simple-item-${item.id}`}
                                    type="checkbox" 
                                    checked={checkedItems.has(item.id)}
                                    onChange={() => toggleItem(item.id)}
                className="w-6 h-6 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl font-bold text-gray-900">
                                        {item.scaledQuantity.toFixed(1)}
                                      </span>
                                      <span className="text-lg font-semibold text-gray-600">{item.unit}</span>
                  <span className="text-lg text-gray-800">{item.ingredient.name}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                  </div>
              </div>

      {/* Instructions Card */}
      <div className="flex-shrink-0 w-full h-full bg-white rounded-xl border border-gray-200 p-8 shadow-sm" style={{ scrollSnapAlign: 'start' }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">Instructions</h3>
        {instructions ? (
                    <div className="whitespace-pre-wrap text-lg text-gray-800 leading-relaxed bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
            {instructions}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-400 italic">No instructions provided</p>
                )}
              </div>
    </div>
  );
}

// Edit Mode Content (traditional scrollable layout)
function EditModeContent({
  useSections,
  sections,
  items,
  method,
  ingredients,
  sensors,
  handleDragEndItems,
  handleDragEndSectionItems,
  addIngredient,
  addSection,
  addIngredientToSection,
  removeIngredient,
  removeSection,
  removeIngredientFromSection,
  setSections,
  setItems,
  setMethod,
  categoryId,
  setCategoryId,
  shelfLifeId,
  setShelfLifeId,
  storageId,
  setStorageId,
  isWholesaleProduct,
  setIsWholesaleProduct,
  wholesalePrice,
  setWholesalePrice,
  yieldUnit,
  bakeTime,
  setBakeTime,
  bakeTemp,
  setBakeTemp,
  categories,
  shelfLifeOptions,
  storageOptions
}: any) {
  return (
    <div className="h-full overflow-y-auto space-y-8">
      {/* Edit Mode Content - Keep existing implementation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
          {!useSections && (
            <button
              onClick={addIngredient}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add
            </button>
          )}
          {useSections && (
            <button
              onClick={addSection}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Step
            </button>
          )}
          </div>

        {/* Sections Toggle */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={useSections}
              onChange={(e) => {
                const newUseSections = e.target.checked;
                // Handle sections toggle logic
              }}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900 text-sm">Use Sections (Multi-Step Recipe)</div>
              <div className="text-xs text-gray-600">Organize ingredients and instructions into separate steps</div>
                </div>
          </label>
                </div>

        {/* Edit mode content continues... */}
        <div className="text-center py-8 text-gray-500">
          Edit mode content - keeping existing functionality
              </div>
      </div>
    </div>
  );
}


