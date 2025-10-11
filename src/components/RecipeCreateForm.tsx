"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { Unit } from "@/generated/prisma";
import { computeIngredientUsageCost } from "@/lib/units";
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

      <select
        value={item.ingredientId}
        onChange={(e) => onUpdate(item.id, "ingredientId", parseInt(e.target.value))}
        className="col-span-4 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">Select ingredient...</option>
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

  const calculateCost = () => {
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
  };

  const totalCost = calculateCost();
  const costPerUnit = yieldQuantity > 0 ? totalCost / yieldQuantity : 0;

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

            {/* Recipe Type Selector */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Recipe Type:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipeType"
                      value="single"
                      checked={yieldUnit === "each" && yieldQuantity === 1}
                      onChange={() => {
                        setYieldUnit("each");
                        setYieldQuantity(1);
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Single Serving</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipeType"
                      value="batch"
                      checked={yieldUnit === "each" && yieldQuantity > 1}
                      onChange={() => {
                        setYieldUnit("each");
                        setYieldQuantity(4);
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Batch Recipe</span>
                  </label>
                </div>
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
                <button
                  type="button"
                  onClick={() => {
                    const url = prompt("Enter image URL:", imageUrl);
                    if (url !== null) setImageUrl(url);
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-xs font-medium"
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Change Image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter image URL:");
                  if (url) setImageUrl(url);
                }}
                className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center group cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-400"
              >
                <svg className="w-8 h-8 text-emerald-400 group-hover:text-emerald-500 transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-emerald-600 font-semibold">Add Image</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Additional Details */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Additional Details</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white hover:border-gray-300 cursor-pointer"
                  style={{ minHeight: '42px' }}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Shelf Life</label>
                <select
                  value={shelfLifeId}
                  onChange={(e) => setShelfLifeId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white hover:border-gray-300 cursor-pointer"
                  style={{ minHeight: '42px' }}
                >
                  <option value="">Select shelf life...</option>
                  {shelfLifeOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Storage</label>
                <select
                  value={storageId}
                  onChange={(e) => setStorageId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white hover:border-gray-300 cursor-pointer"
                  style={{ minHeight: '42px' }}
                >
                  <option value="">Select storage...</option>
                  {storageOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
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

