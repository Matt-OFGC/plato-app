"use client";

import { useState, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/currency";
import { Unit } from "@/generated/prisma";
import { computeIngredientUsageCost } from "@/lib/units";
import { SearchableSelect } from "./SearchableSelect";
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

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
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

// Sortable Item Component
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
      <div
        {...attributes}
        {...listeners}
        className="col-span-1 cursor-grab active:cursor-grabbing flex items-center justify-center text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <div className="col-span-4">
        <SearchableSelect
          options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
          value={item.ingredientId}
          onChange={(value) => onUpdate(item.id, "ingredientId", value || 0)}
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
        <option value="slices">slices</option>
      </select>
      <div className="col-span-2 px-3 py-2 text-sm text-gray-600 flex items-center">
        {formatCurrency(cost)}
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="col-span-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
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
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const totalCost = useMemo(() => {
    let total = 0;
    const itemsToCalc = useSections 
      ? sections.flatMap(s => s.items)
      : items;

    itemsToCalc.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient && item.quantity && parseFloat(item.quantity) > 0) {
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
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please check the console for details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addIngredient = () => {
    if (ingredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.");
      return;
    }
    setItems([...items, {
      id: `item-${Date.now()}`,
      ingredientId: 0,
      quantity: "0",
      unit: "g" as Unit,
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
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: `${sectionId}-item-${Date.now()}`,
            ingredientId: 0,
            quantity: "0",
            unit: "g" as Unit,
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex gap-6 items-start">
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipe Name (e.g., Classic Mac and Cheese)"
              className="text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-emerald-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Add a description..."
              className="text-lg text-gray-600 mb-4 w-full border-2 border-emerald-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <span>Yield:</span>
                <input
                  type="number"
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value)}
                  className="px-2 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="each">servings</option>
                  <option value="g">grams</option>
                  <option value="ml">milliliters</option>
                  <option value="slices">slices</option>
                </select>
              </div>
              <span>Total Cost: {formatCurrency(totalCost)}</span>
              <span>Cost per: {formatCurrency(costPerUnit)}</span>
            </div>

            {/* Recipe Type Selector - Animated Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Recipe Type:</span>
              <div className="relative inline-flex bg-gray-100 rounded-lg p-1 shadow-inner">
                {/* Sliding background */}
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-md shadow-sm transition-all duration-300 ease-out ${
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

          {/* Small Image Preview - Clickable */}
          <div className="w-32 h-32 flex-shrink-0">
            {imageUrl ? (
              <div className="relative group w-full h-full">
                <img 
                  src={imageUrl} 
                  alt="Recipe preview" 
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
      </div>

      {/* Main Grid */}
      <div className="grid xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Details */}
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
                    className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
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
                    className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
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
                    className="w-full px-4 py-3 pr-10 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white hover:bg-white transition-all cursor-pointer appearance-none"
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
                    id="isWholesaleProduct"
                    checked={isWholesaleProduct}
                    onChange={(e) => setIsWholesaleProduct(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isWholesaleProduct" className="flex items-center gap-2 cursor-pointer">
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
                      Price per {yieldUnit}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Baking Section with divider */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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
                            className="w-full px-3 py-2 pr-12 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
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

        {/* Main Content */}
        <div className="xl:col-span-7">
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
                {!useSections && (
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    + Add
                  </button>
                )}
                {useSections && (
                  <button
                    type="button"
                    onClick={addSection}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    + Add Step
                  </button>
                )}
              </div>

              {/* Sections Toggle */}
              <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSections}
                    onChange={(e) => {
                      const newUseSections = e.target.checked;
                      setUseSections(newUseSections);
                      
                      if (newUseSections && items.length > 0) {
                        setSections([{
                          id: "section-0",
                          title: "Step 1",
                          description: "",
                          method: "",
                          bakeTemp: "",
                          bakeTime: "",
                          items: [...items],
                        }]);
                      }
                      
                      if (!newUseSections && sections.length > 0 && sections[0].items.length > 0) {
                        setItems([...sections[0].items]);
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Use Sections (Multi-Step Recipe)</div>
                    <div className="text-xs text-gray-600">Organize ingredients and instructions into separate steps</div>
                  </div>
                </label>
              </div>

              {/* Sections View */}
              {useSections && (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.id} className="bg-gray-50 rounded-xl border-2 border-emerald-200 p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-lg"
                            placeholder="Step title"
                          />
                          <textarea
                            value={section.method}
                            onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, method: e.target.value } : s))}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Bake Time (min)</label>
                              <input
                                type="number"
                                value={section.bakeTime}
                                onChange={(e) => setSections(sections.map(s => s.id === section.id ? { ...s, bakeTime: e.target.value } : s))}
                                placeholder="e.g. 20"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
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
                            type="button"
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
                              <SortableIngredientItem
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

              {/* Simple Ingredients */}
              {!useSections && (
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
            </div>

            {/* Instructions */}
            {!useSections && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
                <textarea
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  rows={8}
                  placeholder="Write your cooking instructions here..."
                  className="w-full border-2 border-emerald-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {useSections && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
                <div className="text-sm text-gray-500 italic text-center py-6 bg-emerald-50 rounded-lg">
                  Instructions are managed within each section above
                </div>
              </div>
            )}

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
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                <span className="text-gray-700">Total Cost:</span>
                <span className="text-2xl font-bold text-emerald-700">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Cost per:</span>
                <span className="text-xl font-semibold text-emerald-600">{formatCurrency(costPerUnit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

