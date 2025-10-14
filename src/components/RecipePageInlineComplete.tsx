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

      <select
        value={item.ingredientId}
        onChange={(e) => {
          const ingredientId = parseInt(e.target.value);
          const selectedIngredient = ingredients.find(i => i.id === ingredientId);
          onUpdate(item.id, "ingredientId", ingredientId);
          if (selectedIngredient?.originalUnit) {
            onUpdate(item.id, "unit", selectedIngredient.originalUnit);
          }
        }}
        className="col-span-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      >
        {ingredients.map((ing) => (
          <option key={ing.id} value={ing.id}>
            {ing.name}
          </option>
        ))}
      </select>
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

      <select
        value={item.ingredientId}
        onChange={(e) => {
          const ingredientId = parseInt(e.target.value);
          const selectedIngredient = ingredients.find(i => i.id === ingredientId);
          onUpdate(item.id, "ingredientId", ingredientId);
          if (selectedIngredient?.originalUnit) {
            onUpdate(item.id, "unit", selectedIngredient.originalUnit);
          }
        }}
        className="col-span-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      >
        {ingredients.map((ing) => (
          <option key={ing.id} value={ing.id}>
            {ing.name}
          </option>
        ))}
      </select>
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
    <div className="max-w-7xl mx-auto">
      {/* Header with Lock/Unlock Toggle */}
      <div className={`mb-6 flex items-center ${isLocked ? 'justify-between' : 'justify-between'}`}>
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

      {/* Recipe Title */}
      <div className={isLocked ? "mb-8 max-w-5xl mx-auto" : "mb-8"}>
        {!isLocked ? (
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
        ) : (
          <>
            {/* Cooking-Focused Header */}
            <div>
              {/* Title with Image on Right */}
              <div className="flex items-start justify-between gap-6 mb-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-3">{name}</h1>
                  {description && <p className="text-xl text-gray-600">{description}</p>}
                </div>
                
                {/* Recipe Image - Next to Title */}
                {(recipe.imageUrl || imageUrl) && (
                  <div className="flex-shrink-0">
                    <img 
                      src={imageUrl || recipe.imageUrl} 
                      alt={recipe.name} 
                      loading="lazy"
                      className="w-auto h-auto max-h-[180px] max-w-[280px] object-cover rounded-2xl shadow-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Servings Control - Centered Below */}
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border-2 border-emerald-200 p-6 shadow-sm inline-flex items-center gap-6">
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Servings</div>
                    <div className="text-xs text-gray-500">Adjust recipe quantity</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      className="w-12 h-12 rounded-full bg-white border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 flex items-center justify-center transition-all text-emerald-700 shadow-sm"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-4xl font-bold text-gray-900 min-w-[4rem] text-center">{servings}</span>
                    <button 
                      onClick={() => setServings(servings + 1)}
                      className="w-12 h-12 rounded-full bg-white border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 flex items-center justify-center transition-all text-emerald-700 shadow-sm"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Stylized Recipe Metadata Cards */}
              <div className="flex justify-center gap-3 flex-wrap">
                {recipe.bakeTemp && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      <span className="text-sm font-bold text-orange-700">{recipe.bakeTemp}°C</span>
                    </div>
                  </div>
                )}
                {recipe.bakeTime && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-blue-700">{recipe.bakeTime} min</span>
                    </div>
                  </div>
                )}
                {recipe.categoryId && categories.find(c => c.id === recipe.categoryId) && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="text-sm font-bold text-purple-700">{categories.find(c => c.id === recipe.categoryId)?.name}</span>
                    </div>
                  </div>
                )}
                {recipe.storageId && storageOptions.find(s => s.id === recipe.storageId) && (
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="text-sm font-bold text-cyan-700">{storageOptions.find(s => s.id === recipe.storageId)?.name}</span>
                    </div>
                  </div>
                )}
                {recipe.shelfLifeId && shelfLifeOptions.find(s => s.id === recipe.shelfLifeId) && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-bold text-amber-700">{shelfLifeOptions.find(s => s.id === recipe.shelfLifeId)?.name}</span>
                    </div>
                  </div>
                )}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(editModeTotalCost * scaleFactor)}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Per {recipe.yieldUnit}</span>
                    <span className="text-sm font-bold text-gray-700">{formatCurrency(editModeCostPerUnit * scaleFactor)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className={isLocked ? "max-w-5xl mx-auto" : "grid xl:grid-cols-12 gap-8"}>
        {/* Left Sidebar - Details (only in edit mode) */}
        {!isLocked && (
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Category</label>
                  <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
                  >
                      <option value="" className="text-gray-400">None</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id} className="text-gray-900">{cat.name}</option>
                    ))}
                  </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Shelf Life</label>
                  <div className="relative">
                  <select
                    value={shelfLifeId}
                    onChange={(e) => setShelfLifeId(e.target.value)}
                      className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
                  >
                      <option value="" className="text-gray-400">None</option>
                    {shelfLifeOptions.map(opt => (
                        <option key={opt.id} value={opt.id} className="text-gray-900">{opt.name}</option>
                    ))}
                  </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Storage</label>
                  <div className="relative">
                  <select
                    value={storageId}
                    onChange={(e) => setStorageId(e.target.value)}
                      className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
                  >
                      <option value="" className="text-gray-400">None</option>
                    {storageOptions.map(opt => (
                        <option key={opt.id} value={opt.id} className="text-gray-900">{opt.name}</option>
                    ))}
                  </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                </div>
                  </div>
                </div>
                
                {/* Wholesale Product Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="isWholesaleProductEdit"
                      checked={isWholesaleProduct}
                      onChange={(e) => setIsWholesaleProduct(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isWholesaleProductEdit" className="flex items-center gap-2 cursor-pointer">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700">Wholesale Product</span>
                    </label>
                  </div>
                  
                  {isWholesaleProduct && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Wholesale Price Per Unit</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={wholesalePrice}
                          onChange={(e) => setWholesalePrice(e.target.value)}
                          placeholder="Per slice/unit"
                          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Price per {yieldUnit} (leave empty to use selling price)
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Baking Section with divider */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                    Baking Details
                  </h4>
                  <div className="space-y-4">
                  {!useSections && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Bake Temperature</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={bakeTemp}
                            onChange={(e) => setBakeTemp(e.target.value)}
                            placeholder="e.g. 180"
                            className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">°C</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Bake Time</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={bakeTime}
                            onChange={(e) => setBakeTime(e.target.value)}
                            placeholder="e.g. 25"
                            className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">min</span>
                        </div>
                      </div>
                    </>
                  )}
                  {useSections && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Using Sections:</strong> Add bake times to individual sections below. The total cooking time will be calculated automatically.
                      </p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Ingredients and Instructions */}
        <div className={!isLocked ? "xl:col-span-7" : ""}>
          <div className="space-y-8">
            {/* Servings Control & Info - Only show here if no image (HIDDEN NOW - we always show left sidebar) */}
            {false && isLocked && !(recipe.imageUrl || imageUrl) && (
              <div className="flex gap-4 flex-wrap">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex flex-col items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Servings</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setServings(Math.max(1, servings - 1))}
                        className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                      <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">{servings}</span>
                    <button 
                      onClick={() => setServings(servings + 1)}
                        className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    </div>
                  </div>
                </div>

                {/* Recipe Info Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="space-y-3">
                    {/* Total Cost */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Cost</span>
                      <span className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(editModeTotalCost * scaleFactor)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200"></div>
                    
                    {/* Cost Per Serving */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Per {recipe.yieldUnit}</span>
                      <span className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(editModeCostPerUnit * scaleFactor)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recipe Steps - Combined View for Sections */}
              {isLocked && recipe.sections.length > 0 ? (
                <div className="space-y-10">
                  {scaledSections.map((section, idx) => (
                    <div key={section.id} className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                              {idx + 1}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{section.title}</h2>
                          </div>
                          {section.items.length > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-600">Progress</div>
                              <div className="text-xl font-bold text-emerald-600">
                                {section.items.filter(item => checkedItems.has(item.id)).length}/{section.items.length}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Bake Info Badges for this step - More Prominent */}
                        {(section.bakeTemp || section.bakeTime) && (
                          <div className="flex gap-3 flex-wrap items-center mb-4">
                            {section.bakeTemp && (
                              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-700">Temp:</span>
                                  <span className="text-xl font-bold text-orange-700">{section.bakeTemp}°C</span>
                                </div>
                              </div>
                            )}
                            {section.bakeTime && (
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-gray-700">Time:</span>
                                    <span className="text-xl font-bold text-blue-700">{section.bakeTime} min</span>
                                  </div>
                                </div>
                                {/* Timer Button - Larger */}
                                {(() => {
                                  const timerId = `recipe-${recipe.id}-section-${section.id}`;
                                  const activeTimer = getTimer(timerId);
                                  
                                  return activeTimer ? (
                                    <div className="bg-emerald-100 rounded-xl border-2 border-emerald-300 px-4 py-3 transition-colors cursor-pointer" title="Timer running (see bottom right)">
                                      <svg className="w-6 h-6 text-emerald-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => startTimer(timerId, recipe.id, recipe.name, section.title, section.bakeTime!)}
                                      className="bg-emerald-50 hover:bg-emerald-100 rounded-xl border-2 border-emerald-300 px-4 py-3 transition-all group shadow-sm hover:shadow"
                                      title="Start timer"
                                    >
                                      <svg className="w-6 h-6 text-emerald-600 group-hover:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </button>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Ingredients for this step - Larger, More Touch-Friendly */}
                      {section.items.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Ingredients</h3>
                          <div className="space-y-3">
                            {section.items.map((item) => (
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
                                  className="w-7 h-7 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl font-bold text-gray-900">
                                      {item.scaledQuantity.toFixed(1)}
                                    </span>
                                    <span className="text-lg font-semibold text-gray-600">{item.unit}</span>
                                    <span className="text-xl text-gray-800">{item.ingredient.name}</span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Instructions for this step - Larger Font */}
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
              ) : (
                <>
              {/* Ingredients */}
              <div className={isLocked ? "bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm" : "bg-white rounded-xl border border-gray-200 p-6"}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={isLocked ? "text-3xl font-bold text-gray-900" : "text-xl font-semibold text-gray-900"}>Ingredients</h2>
                  {isLocked && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-600">Progress</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {checkedItems.size}/{allIngredients.length}
                      </div>
                    </div>
                  )}
                  {!isLocked && !useSections && (
                    <button
                      onClick={addIngredient}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      + Add
                    </button>
                  )}
                  {!isLocked && useSections && (
                    <button
                      onClick={addSection}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      + Add Step
                    </button>
                  )}
                </div>

                {/* Sections Toggle - Only in Edit Mode */}
                {!isLocked && (
                  <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSections}
                        onChange={(e) => {
                          const newUseSections = e.target.checked;
                          setUseSections(newUseSections);
                          
                          // When enabling sections, move existing items to first section
                          if (newUseSections && items.length > 0) {
                            setSections([{
                              id: "section-0",
                              title: "Step 1",
                              description: "",
                              method: "",
                              items: [...items], // Preserve existing ingredients
                            }]);
                          }
                          
                          // When disabling sections, move first section's items back to simple list
                          if (!newUseSections && sections.length > 0 && sections[0].items.length > 0) {
                            setItems([...sections[0].items]);
                          }
                        }}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Use Sections (Multi-Step Recipe)</div>
                        <div className="text-xs text-gray-600">Organize ingredients and instructions into separate steps</div>
                      </div>
                    </label>
                  </div>
                )}

                {/* Edit Mode - Sections */}
                {!isLocked && useSections && (
                  <div className="space-y-6">
                    {sections.map((section, sectionIdx) => (
                      <div key={section.id} className="bg-gray-50 rounded-xl border-2 border-blue-200 p-5 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-lg"
                              placeholder="Step title"
                            />
                            <textarea
                              value={section.method}
                              onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, method: e.target.value } : s))}
                              rows={3}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Instructions for this step..."
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Bake Temp (°C)</label>
                                    <input
                                      type="number"
                                      value={section.bakeTemp}
                                      onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bakeTemp: e.target.value } : s))}
                                      placeholder="e.g. 180"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Bake Time (min)</label>
                                    <input
                                      type="number"
                                      value={section.bakeTime}
                                      onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bakeTime: e.target.value } : s))}
                                      placeholder="e.g. 20"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                </div>
                          </div>
                          <button
                            onClick={() => removeSection(section.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Ingredients for this step</h4>
                            <button
                              onClick={() => addIngredientToSection(section.id)}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                              + Add Ingredient
                            </button>
                          </div>
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEndSectionItems(section.id)}
                              >
                                <SortableContext
                                  items={section.items.map((item) => item.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  {section.items.map((item) => (
                                    <SortableSectionIngredientItem
                                      key={item.id}
                                      item={item}
                                      ingredients={ingredients}
                                      onUpdate={(id, field, value) => {
                                        setSections(sections.map(s => {
                                    if (s.id === section.id) {
                                            return { ...s, items: s.items.map(i => i.id === id ? { ...i, [field]: value } : i) };
                                    }
                                    return s;
                                        }));
                                      }}
                                      onRemove={(id) => removeIngredientFromSection(section.id, id)}
                                    />
                                  ))}
                                </SortableContext>
                              </DndContext>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Edit Mode - Simple Ingredients */}
                {!isLocked && !useSections && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndItems}
                      >
                        <SortableContext
                          items={items.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {items.map((item) => (
                              <SortableIngredientItem
                                key={item.id}
                                item={item}
                                ingredients={ingredients}
                                onUpdate={(id, field, value) => {
                                  setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
                                }}
                                onRemove={removeIngredient}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                    
                    {/* View Mode - Simple Ingredients (no sections) */}
                {isLocked && (
                  <div className="space-y-3">
                        {scaledIngredients.map((item) => (
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
                                    className="w-7 h-7 text-emerald-600 rounded-lg focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <span className="text-2xl font-bold text-gray-900">
                                        {item.scaledQuantity.toFixed(1)}
                                      </span>
                                      <span className="text-lg font-semibold text-gray-600">{item.unit}</span>
                                      <span className="text-xl text-gray-800">{item.ingredient.name}</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                  </div>
                )}
              </div>

                  {/* Instructions - Only for simple recipes without sections */}
              <div className={isLocked ? "bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm" : "bg-white rounded-xl border border-gray-200 p-6"}>
                <h2 className={isLocked ? "text-3xl font-bold text-gray-900 mb-6" : "text-xl font-semibold text-gray-900 mb-4"}>Instructions</h2>
                {!isLocked && !useSections ? (
                  <textarea
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    rows={8}
                    placeholder="Write your cooking instructions here..."
                    className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : !isLocked && useSections ? (
                  <div className="text-sm text-gray-500 italic text-center py-6 bg-blue-50 rounded-lg">
                    Instructions are managed within each section above
                    </div>
                  ) : recipe.method ? (
                    <div className="whitespace-pre-wrap text-lg text-gray-800 leading-relaxed bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      {recipe.method}
                    </div>
                  ) : (
                    <p className="text-lg text-gray-400 italic">No instructions provided</p>
                )}
              </div>
                </>
              )}
            </div>
          </div>

        {/* Right Sidebar - Cost Breakdown (only in edit mode) */}
        {!isLocked && (
          <div className="xl:col-span-3">
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                  <span className="text-gray-700">Total Cost:</span>
                  <span className="text-2xl font-bold text-emerald-700">{formatCurrency(editModeTotalCost)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Cost per:</span>
                  <span className="text-xl font-semibold text-emerald-600">{formatCurrency(editModeCostPerUnit)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

