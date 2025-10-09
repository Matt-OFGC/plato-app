"use client";

import { useState, useMemo } from "react";
import { Unit } from "@/generated/prisma";
import { computeRecipeCost, computeIngredientUsageCost } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Ingredient {
  id: number;
  name: string;
  packQuantity?: number;
  packUnit?: string;
  packPrice?: number;
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

interface RecipeSection {
  id: string;
  title: string;
  method?: string;
  items: Array<{
    id: string;
    ingredientId: number;
    quantity: string;
    unit: Unit;
  }>;
}

interface RecipeFormSimplifiedProps {
  ingredients: Ingredient[];
  categories?: Category[];
  shelfLifeOptions?: ShelfLifeOption[];
  storageOptions?: StorageOption[];
  onSubmit: (data: any) => void;
  initial?: {
    name: string;
    recipeType?: "single" | "batch";
    servings?: number;
    method?: string;
    imageUrl?: string;
    categoryId?: number;
    shelfLifeId?: number;
    storageId?: number;
    bakeTime?: number;
    bakeTemp?: number;
    items: Array<{
      ingredientId: number;
      quantity: string;
      unit: Unit;
    }>;
  };
}

export function RecipeFormSimplified({ 
  ingredients, 
  categories = [],
  shelfLifeOptions = [],
  storageOptions = [],
  onSubmit,
  initial 
}: RecipeFormSimplifiedProps) {
  const [recipeType, setRecipeType] = useState<"single" | "batch">(initial?.recipeType || "single");
  const [name, setName] = useState(initial?.name || "");
  const [servings, setServings] = useState(initial?.servings || 1);
  const [method, setMethod] = useState(initial?.method || "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(initial?.categoryId);
  const [shelfLifeId, setShelfLifeId] = useState<number | undefined>(initial?.shelfLifeId);
  const [storageId, setStorageId] = useState<number | undefined>(initial?.storageId);
  const [bakeTime, setBakeTime] = useState<number | undefined>(initial?.bakeTime);
  const [bakeTemp, setBakeTemp] = useState<number | undefined>(initial?.bakeTemp);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Sections-based state
  const [useSections, setUseSections] = useState(false);
  const [sections, setSections] = useState<RecipeSection[]>([
    {
      id: "section-1",
      title: "layer 1",
      method: "to do this layer you need to add magic",
      items: [{ id: "item-1", ingredientId: 0, quantity: "", unit: "g" as Unit }]
    }
  ]);
  
  // Simple list state (fallback)
  const [recipeItems, setRecipeItems] = useState<Array<{
    ingredientId: number;
    quantity: string;
    unit: Unit;
  }>>(initial?.items || [{ ingredientId: 0, quantity: "", unit: "g" as Unit }]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get all items from sections or simple list
  const allItems = useMemo(() => {
    if (useSections) {
      return sections.flatMap(section => 
        section.items.map(item => ({
          ...item,
          sectionTitle: section.title
        }))
      );
    } else {
      return recipeItems.map(item => ({
        ...item,
        sectionTitle: "Main ingredients"
      }));
    }
  }, [useSections, sections, recipeItems]);

  // Calculate real-time cost
  const totalCost = useMemo(() => {
    const validItems = allItems
      .filter(item => item.ingredientId && item.quantity)
      .map(item => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        if (!ing || !ing.packQuantity || !ing.packPrice) return null;
        
        return {
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          ingredient: {
            packQuantity: ing.packQuantity,
            packUnit: ing.packUnit as any,
            packPrice: ing.packPrice,
            densityGPerMl: ing.densityGPerMl || undefined,
          }
        };
      })
      .filter(Boolean) as any[];

    if (validItems.length === 0) return 0;
    
    try {
      return computeRecipeCost({ items: validItems });
    } catch {
      return 0;
    }
  }, [allItems, ingredients]);

  const costPerServing = totalCost / servings;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData object for server action
    const formData = new FormData();
    formData.append("name", name);
    formData.append("recipeType", recipeType);
    formData.append("servings", servings.toString());
    formData.append("useSections", useSections.toString());
    
    if (method) formData.append("method", method);
    if (imageUrl) formData.append("imageUrl", imageUrl);
    if (categoryId) formData.append("categoryId", categoryId.toString());
    if (shelfLifeId) formData.append("shelfLifeId", shelfLifeId.toString());
    if (storageId) formData.append("storageId", storageId.toString());
    if (bakeTime) formData.append("bakeTime", bakeTime.toString());
    if (bakeTemp) formData.append("bakeTemp", bakeTemp.toString());
    
    // Add sections if using sections
    if (useSections) {
      sections.forEach((section, sectionIndex) => {
        formData.append(`section_${sectionIndex}_title`, section.title);
        if (section.method) formData.append(`section_${sectionIndex}_method`, section.method);
        
        section.items
          .filter(item => item.ingredientId && item.quantity)
          .forEach((item, itemIndex) => {
            formData.append(`section_${sectionIndex}_item_${itemIndex}_ingredientId`, item.ingredientId.toString());
            formData.append(`section_${sectionIndex}_item_${itemIndex}_quantity`, item.quantity);
            formData.append(`section_${sectionIndex}_item_${itemIndex}_unit`, item.unit);
          });
      });
    } else {
      // Add each ingredient (simple list)
      recipeItems
        .filter(item => item.ingredientId && item.quantity)
        .forEach(item => {
          formData.append("ingredientId", item.ingredientId.toString());
          formData.append("quantity", item.quantity);
          formData.append("unit", item.unit);
        });
    }
    
    onSubmit(formData);
  };

  // Helper functions for sections
  const addSection = () => {
    const sectionNames = ["layer 1", "layer 2", "layer 3", "base", "topping", "filling", "glaze", "decoration"];
    const newSection: RecipeSection = {
      id: `section-${Date.now()}`,
      title: sectionNames[sections.length] || `Section ${sections.length + 1}`,
      method: "",
      items: [{ id: `item-${Date.now()}`, ingredientId: 0, quantity: "", unit: "g" as Unit }]
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  const updateSection = (sectionId: string, field: keyof RecipeSection, value: any) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const addItemToSection = (sectionId: string) => {
    const newItem = {
      id: `item-${Date.now()}`,
      ingredientId: 0,
      quantity: "",
      unit: "g" as Unit
    };
    
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...s.items, newItem] }
        : s
    ));
  };

  const removeItemFromSection = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.filter(item => item.id !== itemId) }
        : s
    ));
  };

  const updateItemInSection = (sectionId: string, itemId: string, field: string, value: any) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { 
            ...s, 
            items: s.items.map(item => 
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : s
    ));
  };

  // Drag and drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle section reordering
    if (active.id.toString().startsWith('section-') && over.id.toString().startsWith('section-')) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      if (oldIndex !== newIndex) {
        setSections(arrayMove(sections, oldIndex, newIndex));
      }
      return;
    }
    
    // Handle item reordering within a section
    const activeItem = active.id.toString();
    const overItem = over.id.toString();
    
    if (activeItem.startsWith('item-') && overItem.startsWith('item-')) {
      sections.forEach(section => {
        const activeIndex = section.items.findIndex(item => item.id === activeItem);
        const overIndex = section.items.findIndex(item => item.id === overItem);
        
        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newItems = arrayMove(section.items, activeIndex, overIndex);
          updateSection(section.id, 'items', newItems);
        }
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Client-side file size check (10MB)
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
  };

  const addIngredient = () => {
    setRecipeItems([...recipeItems, { ingredientId: 0, quantity: "", unit: "g" as Unit }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeItems];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeItems(updated);
  };

  const currencySymbol = "£"; // TODO: Get from user preferences

  // Sortable Item Component (moved outside to fix hooks order)
  const SortableItem = ({ 
    item, 
    sectionId, 
    onUpdate, 
    onRemove, 
    ingredients, 
    currencySymbol 
  }: {
    item: any;
    sectionId: string;
    onUpdate: (sectionId: string, itemId: string, field: string, value: any) => void;
    onRemove: (sectionId: string, itemId: string) => void;
    ingredients: Ingredient[];
    currencySymbol: string;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    // Calculate cost for this item
    const itemCost = useMemo(() => {
      if (!item.ingredientId || !item.quantity) return 0;
      
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (!ingredient || !ingredient.packQuantity || !ingredient.packPrice) return 0;
      
      try {
        return computeIngredientUsageCost({
          usageQuantity: parseFloat(item.quantity),
          usageUnit: item.unit,
          ingredient: {
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit as any,
            packPrice: ingredient.packPrice,
            densityGPerMl: ingredient.densityGPerMl || undefined,
          }
        });
      } catch {
        return 0;
      }
    }, [item, ingredients]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Ingredient selection */}
        <select
          value={item.ingredientId}
          onChange={(e) => onUpdate(sectionId, item.id, 'ingredientId', parseInt(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="0">Select ingredient...</option>
          {ingredients.map((ing) => (
            <option key={ing.id} value={ing.id}>{ing.name}</option>
          ))}
        </select>

        {/* Quantity */}
        <input
          type="number"
          step="0.01"
          value={item.quantity}
          onChange={(e) => onUpdate(sectionId, item.id, 'quantity', e.target.value)}
          placeholder="Amount"
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        />

        {/* Unit */}
        <select
          value={item.unit}
          onChange={(e) => onUpdate(sectionId, item.id, 'unit', e.target.value)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
          <option value="each">each</option>
          <option value="slices">slices</option>
          <option value="tsp">tsp</option>
          <option value="tbsp">tbsp</option>
          <option value="cup">cup</option>
        </select>

        {/* Cost display */}
        <div className="w-20 text-right">
          <span className="text-sm font-medium text-emerald-600">
            {currencySymbol}{itemCost.toFixed(2)}
          </span>
        </div>

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(sectionId, item.id)}
          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
  };

  // Sortable Section Component
  const SortableSection = ({ section, index }: { section: RecipeSection; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          
          {/* Section title - exactly like the image */}
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
            className="flex-1 text-lg font-semibold text-gray-900 border-none outline-none bg-transparent placeholder-gray-500"
            placeholder="Section name"
          />
          
          {/* Delete section */}
          {sections.length > 1 && (
            <button
              type="button"
              onClick={() => removeSection(section.id)}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Section method - exactly like the image */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
          <textarea
            value={section.method || ""}
            onChange={(e) => updateSection(section.id, 'method', e.target.value)}
            placeholder="Instructions for this section..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-y text-sm"
          />
        </div>

        {/* Section items - exactly like the image */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Ingredients</h4>
            <button
              type="button"
              onClick={() => addItemToSection(section.id)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              + Add ingredient
            </button>
          </div>

          <SortableContext items={section.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
            {section.items.map((item, itemIndex) => (
              <SortableItem
                key={item.id}
                item={item}
                sectionId={section.id}
                onUpdate={updateItemInSection}
                onRemove={removeItemFromSection}
                ingredients={ingredients}
                currencySymbol={currencySymbol}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    );
  };


  return (
    <form onSubmit={handleSubmit} className="max-w-none mx-auto px-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT SIDEBAR - ADDITIONAL DETAILS (3 columns) */}
        <div className="xl:col-span-3">
          <div className="xl:sticky xl:top-8 space-y-6">
            {/* Additional Details Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Additional Details</h3>

              {/* Category, Shelf Life, Storage in a vertical stack */}
              <div className="space-y-5">
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">None</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {shelfLifeOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Life</label>
                    <select
                      value={shelfLifeId || ""}
                      onChange={(e) => setShelfLifeId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">None</option>
                      {shelfLifeOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {storageOptions.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                    <select
                      value={storageId || ""}
                      onChange={(e) => setStorageId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">None</option>
                      {storageOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Bake Time & Temperature */}
              <div className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bake Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={bakeTime || ""}
                    onChange={(e) => setBakeTime(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 25"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bake Temperature (°C)
                  </label>
                  <input
                    type="number"
                    value={bakeTemp || ""}
                    onChange={(e) => setBakeTemp(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 180"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Method */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method / Instructions
                </label>
                <textarea
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="Step-by-step instructions..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-y"
                />
              </div>

              {/* Image Upload */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Image
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="w-full"
                  />
                  {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
                  {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
                  {imageUrl && (
                    <div>
                      <img src={imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-lg border" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN - MAIN RECIPE CONTENT (5 columns) */}
        <div className="xl:col-span-5 space-y-6">
        {/* Recipe Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipe Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bacon Sandwich, Victoria Sponge Cake"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

      {/* Recipe Type Selector - THIS IS THE KEY! */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border-2 border-emerald-200">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          What type of recipe is this?
        </label>
        <div className="grid grid-cols-2 gap-4">
          {/* Single Serving */}
          <button
            type="button"
            onClick={() => { setRecipeType("single"); setServings(1); }}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              recipeType === "single"
                ? "border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-200"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                recipeType === "single" ? "bg-emerald-500" : "bg-gray-300"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Single Serving</h3>
                <p className="text-sm text-gray-600">
                  Makes 1 item
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Examples: Sandwich, Burger, Cocktail, Coffee
                </p>
              </div>
            </div>
          </button>

          {/* Batch/Multiple Servings */}
          <button
            type="button"
            onClick={() => setRecipeType("batch")}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              recipeType === "batch"
                ? "border-emerald-500 bg-white shadow-lg ring-2 ring-emerald-200"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                recipeType === "batch" ? "bg-emerald-500" : "bg-gray-300"
              }`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Batch Recipe</h3>
                <p className="text-sm text-gray-600">
                  Makes multiple servings
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Examples: Cake tray (24 slices), Soup pot (10 bowls)
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Batch Size - Only show for batch recipes */}
      {recipeType === "batch" && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            How many servings does one batch make?
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              min="1"
              className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
              required
            />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Example:</span> If you bake a tray that you cut into 24 slices, enter <strong>24</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The app will calculate cost per slice automatically
              </p>
            </div>
          </div>
        </div>
      )}

          {/* Ingredients Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
                
                {/* Use Sections Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSections}
                    onChange={(e) => setUseSections(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Use sections</span>
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500">
                  {recipeType === "single" ? "For 1 serving" : `For 1 batch (${servings} servings)`}
                </p>
                
                {useSections && (
                  <button
                    type="button"
                    onClick={addSection}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Section
                  </button>
                )}
              </div>
            </div>

            {/* Ingredients Content */}
            {useSections ? (
              /* Sections-based ingredients */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-6">
                    {sections.map((section, index) => (
                      <SortableSection key={section.id} section={section} index={index} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              /* Simple list ingredients */
              <div className="space-y-3">
                {recipeItems.map((item, index) => {
                  // Calculate cost for this item (inline calculation to avoid hooks in map)
                  const itemCost = (() => {
                    if (!item.ingredientId || !item.quantity) return 0;
                    
                    const ingredient = ingredients.find(i => i.id === item.ingredientId);
                    if (!ingredient || !ingredient.packQuantity || !ingredient.packPrice) return 0;
                    
                    try {
                      return computeIngredientUsageCost({
                        usageQuantity: parseFloat(item.quantity),
                        usageUnit: item.unit,
                        ingredient: {
                          packQuantity: ingredient.packQuantity,
                          packUnit: ingredient.packUnit as any,
                          packPrice: ingredient.packPrice,
                          densityGPerMl: ingredient.densityGPerMl || undefined,
                        }
                      });
                    } catch {
                      return 0;
                    }
                  })();

                  return (
                    <div key={index} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg border">
                      {/* Ingredient Selection */}
                      <select
                        value={item.ingredientId}
                        onChange={(e) => updateIngredient(index, "ingredientId", parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="0">Select ingredient...</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>

                      {/* Quantity */}
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                        placeholder="Amount"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      />

                      {/* Unit */}
                      <select
                        value={item.unit}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value as Unit)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="each">each</option>
                        <option value="slices">slices</option>
                        <option value="tsp">tsp</option>
                        <option value="tbsp">tbsp</option>
                        <option value="cup">cup</option>
                      </select>

                      {/* Cost Display */}
                      <div className="w-20 text-right">
                        <span className="text-sm font-medium text-emerald-600">
                          {currencySymbol}{itemCost.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      {recipeItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addIngredient}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors font-medium"
                >
                  + Add Ingredient
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold text-lg shadow-lg"
          >
            Save Recipe
          </button>
        </div>

        {/* RIGHT SIDEBAR - COST BREAKDOWN (4 columns) */}
        <div className="xl:col-span-4">
          <div className="xl:sticky xl:top-8 space-y-6">
            {/* Real-time Cost Display */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border-2 border-emerald-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Live Cost Breakdown
              </h3>

              {recipeType === "single" ? (
                /* Single Serving Display */
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">Cost per serving</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {currencySymbol}{totalCost.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Updates as you add ingredients
                  </p>
                </div>
              ) : (
                /* Batch Recipe Display */
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">Total batch cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currencySymbol}{totalCost.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span>Divided by {servings} servings</span>
                  </div>

                  <div className="bg-emerald-600 text-white rounded-lg p-4">
                    <p className="text-sm opacity-90 mb-1">Cost per serving</p>
                    <p className="text-3xl font-bold">
                      {currencySymbol}{costPerServing.toFixed(2)}
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 text-center">
                    Updates as you add ingredients
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Suggestions */}
            {totalCost > 0 && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Suggested Pricing
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conservative (2x):</span>
                    <span className="font-semibold">{currencySymbol}{(costPerServing * 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between bg-blue-600 text-white px-2 py-1 rounded">
                    <span>Recommended (3x):</span>
                    <span className="font-bold">{currencySymbol}{(costPerServing * 3).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Premium (4x):</span>
                    <span className="font-semibold">{currencySymbol}{(costPerServing * 4).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

