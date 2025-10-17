"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { SearchableSelect } from "./SearchableSelect";
import { useTimers } from "@/contexts/TimerContext";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  originalUnit?: string | null;
  packPrice: number;
  densityGPerMl?: number | null;
  allergens?: string[];
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
  price?: string;
  note?: string;
}

interface RecipeSection {
  id: string;
  title: string;
  description: string;
  method: string;
  bakeTemp: string;
  bakeTime: string;
  items: RecipeItem[];
}

interface RecipePageInlineCompleteTestProps {
  recipe: {
    id: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    method?: string | null;
    yieldQuantity: number;
    yieldUnit: string;
    categoryId?: number | null;
    shelfLifeId?: number | null;
    storageId?: number | null;
    bakeTime?: number | null;
    bakeTemp?: number | null;
    category?: {
      id: number;
      name: string;
    } | null;
    storage?: {
      id: number;
      name: string;
    } | null;
    shelfLife?: {
      id: number;
      name: string;
    } | null;
    sections: Array<{
      id: number;
      title: string;
      description?: string | null;
      method?: string | null;
      bakeTemp?: number | null;
      bakeTime?: number | null;
      items: Array<{
        id: number;
        quantity: number;
        unit: string;
        price?: number | null;
        note?: string | null;
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
      price?: number | null;
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

export function RecipePageInlineCompleteV2({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  wholesaleProduct,
  onSave,
}: RecipePageInlineCompleteTestProps) {
  // Global timer context
  const { timers, startTimer, stopTimer, getTimer } = useTimers();
  
  // Lock/Unlock state
  const [isLocked, setIsLocked] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Cooking mode state
  const [servings, setServings] = useState(recipe.yieldQuantity);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
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
  
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Pricing calculator
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [showCogsInfo, setShowCogsInfo] = useState(false);
  
  // Wholesale product state
  const [isWholesaleProduct, setIsWholesaleProduct] = useState(!!wholesaleProduct?.isActive);
  const [wholesalePrice, setWholesalePrice] = useState(wholesaleProduct?.price || "");
  
  // Batch recipe state
  const [isBatchRecipe, setIsBatchRecipe] = useState(false);
  const [slicesPerBatch, setSlicesPerBatch] = useState(8);
  
  // Allergens popup state
  const [showAllergensPopup, setShowAllergensPopup] = useState(false);
  
  // Notes state
  const [notes, setNotes] = useState("");
  
  // View mode state - true = carousel view, false = whole recipe view
  const [isCarouselView, setIsCarouselView] = useState(true);

  // Handle view mode change and reset to first section
  const handleViewModeChange = (newIsCarouselView: boolean) => {
    setIsCarouselView(newIsCarouselView);
    if (newIsCarouselView) {
      // When switching to carousel view, go to first section
      setCurrentStep(0);
    }
  };
  
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
            price: item.price?.toString() || "",
            note: item.note || "",
          })),
        }))
      : [{ id: "section-0", title: "Step 1", description: "", method: "", bakeTemp: "", bakeTime: "", items: [] }]
  );
  
  // Calculate total bake time from sections if using sections
  const displayBakeTime = useSections && sections.length > 0
    ? sections
        .map(s => parseInt(s.bakeTime) || 0)
        .reduce((a, b) => a + b, 0)
    : parseInt(bakeTime.toString()) || 0;
  
  // Calculate total bake temp from sections if using sections
  const displayBakeTemp = useSections && sections.length > 0
    ? Math.max(...sections.map(s => parseInt(s.bakeTemp) || 0))
    : parseInt(bakeTemp.toString()) || 0;

  // Get all ingredients for progress calculation
  const allIngredients = useMemo(() => {
    if (useSections) {
      return sections.flatMap(section => section.items);
    } else {
      return recipe.items;
    }
  }, [useSections, sections, recipe.items]);

  // Aggregate allergens from all ingredients
  const allAllergens = useMemo(() => {
    const allergenSet = new Set<string>();
    
    allIngredients.forEach(item => {
      const ingredientId = 'ingredientId' in item ? item.ingredientId : item.ingredient.id;
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (ingredient?.allergens) {
        ingredient.allergens.forEach(allergen => allergenSet.add(allergen));
      }
    });
    
    return Array.from(allergenSet).sort();
  }, [allIngredients, ingredients]);

  // Toggle item checked state
  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
    } else {
        newSet.add(itemId);
    }
      return newSet;
    });
  }, []);

  // Carousel state
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = useSections ? sections.length : 2;
  const [newlyAddedSection, setNewlyAddedSection] = useState<string | null>(null);

  // Navigation functions
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper functions for sections and items
  const addSection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newSection: RecipeSection = {
      id: `section-${sections.length}`,
      title: `Step ${sections.length + 1}`,
      description: "",
      method: "",
      bakeTemp: "",
      bakeTime: "",
      items: []
    };
    setSections([...sections, newSection]);
    setNewlyAddedSection(newSection.id);
    
    // Animate to the new section after a brief delay to allow the section to render
    setTimeout(() => {
      setCurrentStep(sections.length); // New section will be at this index
    }, 100);
    
    // Clear the newly added flag after animation
    setTimeout(() => {
      setNewlyAddedSection(null);
    }, 1000);
  };

  const removeSection = (sectionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
      // Adjust current step if needed
      if (currentStep >= sections.length - 1) {
        setCurrentStep(Math.max(0, sections.length - 2));
      }
    }
  };

  const updateSection = (sectionId: string, field: string, value: any) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const addSectionItem = (sectionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Adding ingredient to section:', sectionId, 'Available ingredients:', ingredients.length);
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...s.items, { id: `item-${Date.now()}`, ingredientId: ingredients.length > 0 ? ingredients[0].id : 0, quantity: "1", unit: "g" as Unit, price: "", note: "" }] }
        : s
    ));
  };

  const removeSectionItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.filter(item => item.id !== itemId) }
        : s
    ));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: string, value: any) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.map(item => item.id === itemId ? { ...item, [field]: value } : item) }
        : s
    ));
  };

  // Drag and drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Handle section item reordering
    const activeSectionId = active.data.current?.sectionId;
    const overSectionId = over.data.current?.sectionId;
    
    if (activeSectionId === overSectionId) {
      // Reorder within same section
      const section = sections.find(s => s.id === activeSectionId);
      if (section) {
        const oldIndex = section.items.findIndex(item => item.id === active.id);
        const newIndex = section.items.findIndex(item => item.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(section.items, oldIndex, newIndex);
          updateSection(activeSectionId, 'items', newItems);
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('recipeId', recipe.id.toString());
      formData.append('name', name);
      formData.append('description', description);
      formData.append('imageUrl', imageUrl);
      formData.append('method', method);
      formData.append('yieldQuantity', yieldQuantity.toString());
      formData.append('yieldUnit', yieldUnit);
      formData.append('categoryId', categoryId.toString());
      formData.append('shelfLifeId', shelfLifeId.toString());
      formData.append('storageId', storageId.toString());
      formData.append('useSections', 'true');
      formData.append('isWholesaleProduct', isWholesaleProduct.toString());
      formData.append('wholesalePrice', wholesalePrice);
      formData.append('sections', JSON.stringify(sections));
      
      await onSave(formData);
      // Optionally lock after save
      setIsLocked(true);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Sortable Ingredient Component
  const SortableIngredientItem = ({ 
    item, 
    sectionId, 
    onUpdate, 
    onRemove 
  }: { 
    item: any; 
    sectionId?: string; 
    onUpdate: (field: string, value: any) => void;
    onRemove: () => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: item.id,
      data: { sectionId }
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const ingredient = ingredients.find(ing => ing.id === item.ingredientId);

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-4 p-6 rounded-lg transition-colors touch-manipulation ${
          isLocked ? 'cursor-pointer' : ''
        } ${
          checkedItems.has(item.id) ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={() => isLocked && toggleItem(item.id)}
      >
        {!isLocked && (
          <div 
            {...attributes}
            {...listeners}
            className="flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}
        
        {isLocked && (
          <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center touch-manipulation ${
            checkedItems.has(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
          }`}>
            {checkedItems.has(item.id) && (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        
        <div className="flex-1">
          {isLocked ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {(parseFloat(item.quantity) * (servings / recipe.yieldQuantity)).toFixed(1)}
              </span>
              <span className="text-xl text-gray-600">{item.unit}</span>
              <span className="text-xl text-gray-900">{ingredient?.name || 'Unknown ingredient'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4">
                <SearchableSelect
                  options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
                  value={item.ingredientId}
                  onChange={(value) => onUpdate('ingredientId', value)}
                  placeholder="Search ingredients..."
                />
              </div>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate('quantity', e.target.value)}
                placeholder="Qty"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={item.unit}
                onChange={(e) => onUpdate('unit', e.target.value)}
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="each">each</option>
              </select>
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-gray-500 font-medium">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price || ""}
                  onChange={(e) => onUpdate('price', e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
          
          {item.note && (
            <div className="text-sm text-gray-500 mt-1">
              {isLocked ? item.note : (
                <input
                  type="text"
                  value={item.note}
                  onChange={(e) => onUpdate('note', e.target.value)}
                  placeholder="Note"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                />
              )}
            </div>
          )}
        </div>
        
        {!isLocked && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-600 hover:text-red-800 p-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 -mx-4 -my-8 border-4 border-gray-200 rounded-2xl m-4 shadow-2xl">
      {/* Header Container */}
      <div className="flex-shrink-0 px-6 pt-8 pb-2 border-l-2 border-r-2 border-gray-100">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              {/* Recipe Image in Header */}
              <div className="flex-shrink-0 relative group">
                {(recipe.imageUrl || imageUrl) ? (
                  <img 
                    src={imageUrl || recipe.imageUrl || ""} 
                    alt={recipe.name} 
                    className="w-20 h-16 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {!isLocked && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="bg-white text-gray-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
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
                        disabled={uploading}
                      />
                      {uploading ? '...' : (recipe.imageUrl || imageUrl) ? 'Edit' : 'Add'}
                    </label>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-1">
                {isLocked ? (
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{name}</h1>
                ) : (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 tracking-tight bg-transparent border-b-2 border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none"
                    placeholder="Recipe name..."
                  />
                )}
                <div className="text-sm text-gray-500 font-medium">
                  Recipe • {recipe.category?.name || 'Uncategorized'} • {recipe.yieldQuantity} {recipe.yieldUnit}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
        {/* View Mode Toggle - Segmented Control Style */}
        <div className="flex items-center">
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            {/* Whole Recipe Option */}
            <button
              onClick={() => handleViewModeChange(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !isCarouselView
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Whole Recipe
            </button>
            
            {/* Carousel Option */}
            <button
              onClick={() => handleViewModeChange(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                isCarouselView
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Carousel
            </button>
          </div>
        </div>

              <button
                onClick={() => setIsLocked(!isLocked)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${
                  isLocked 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                }`}
              >
                {isLocked ? '🔒 Locked' : '🔓 Editing'}
              </button>
              
              {!isLocked && (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Recipe'}
                </button>
              )}
              
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium">
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex gap-4 md:gap-6 lg:gap-8 min-h-0 pt-2 md:pt-3 lg:pt-2 pb-12 px-4 md:px-6 lg:px-8 border-l-2 border-r-2 border-gray-100 recipe-layout">
        {/* Left Panel - Recipe Overview (Responsive) */}
        <div className="w-32 md:w-36 lg:w-40 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 md:p-4 shadow-sm overflow-y-auto">

          {/* Servings Adjuster */}
          <div className="mb-4">
            <div className="text-center">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Servings</div>
              <div className="text-xs text-gray-500 mb-3">Adjust recipe quantity</div>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                  </svg>
                </button>
                <span className="text-3xl font-bold text-gray-900 min-w-[3rem] text-center">{servings}</span>
                <button 
                  onClick={() => setServings(servings + 1)}
                  className="w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Batch/Single Recipe Toggle - Only in Edit Mode */}
          {!isLocked && (
            <div className="mb-4">
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recipe Type</div>
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setIsBatchRecipe(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      !isBatchRecipe 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    onClick={() => setIsBatchRecipe(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isBatchRecipe 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Batch
                  </button>
                </div>
                {isBatchRecipe && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Slices per batch</div>
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSlicesPerBatch(Math.max(1, slicesPerBatch - 1))}
                        className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors text-blue-700 touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">{slicesPerBatch}</span>
                      <button 
                        onClick={() => setSlicesPerBatch(slicesPerBatch + 1)}
                        className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors text-blue-700 touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Metadata Badges */}
          <div className="space-y-2 mb-4">
            {recipe.bakeTemp && (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                  </svg>
                  <span className="text-xs font-semibold text-orange-700">{displayBakeTemp}°C</span>
                </div>
              </div>
            )}
                
            {recipe.bakeTime && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-blue-700">{displayBakeTime}m</span>
                </div>
              </div>
            )}
                
            {recipe.category && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-xs font-semibold text-purple-700 truncate">{recipe.category.name}</span>
                </div>
              </div>
            )}
                
            {recipe.storage && (
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-xs font-semibold text-cyan-700 truncate">{recipe.storage.name}</span>
                </div>
              </div>
            )}
                
            {recipe.shelfLife && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-amber-700 truncate">{recipe.shelfLife.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Cost Analysis */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-3 shadow-sm mb-3">
            <div className="text-center">
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Cost Analysis</div>
              
              {/* Total Cost */}
              <div className="mb-3">
                <div className="text-lg font-bold text-emerald-700 mb-1">{formatCurrency(costBreakdown.totalCost)}</div>
                <div className="text-xs text-emerald-600">Total Cost</div>
              </div>
              
              {/* Per Slice Cost - Show this prominently */}
              <div className="mb-3">
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {isBatchRecipe 
                    ? formatCurrency(costBreakdown.totalCost / slicesPerBatch)
                    : formatCurrency(costBreakdown.costPerOutputUnit)
                  }
                </div>
                <div className="text-xs text-gray-600">
                  {isBatchRecipe ? 'Per Slice' : `Per ${recipe.yieldUnit}`}
                </div>
              </div>
              
              {/* Sell Price Input */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-1">Sell Price</div>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              {/* COGS Percentage */}
              {sellPrice > 0 && (
                <div className="mb-2">
                  {(() => {
                    const cogsPercentage = isBatchRecipe 
                      ? ((costBreakdown.totalCost / slicesPerBatch) / sellPrice) * 100
                      : (costBreakdown.costPerOutputUnit / sellPrice) * 100;
                    
                    const isGoodCogs = cogsPercentage <= 25;
                    const isBadCogs = cogsPercentage >= 30;
                    
                    return (
                      <div className={`text-sm font-semibold ${isGoodCogs ? 'text-green-600' : isBadCogs ? 'text-red-600' : 'text-yellow-600'}`}>
                        {cogsPercentage.toFixed(1)}% COGS
                      </div>
                    );
                  })()}
                  <div className="text-xs text-gray-500">Cost of Goods</div>
                </div>
              )}
              
              {/* Traditional per unit cost */}
              <div className="text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2">
                <div className="text-sm font-medium text-gray-700">{formatCurrency(costBreakdown.costPerOutputUnit)}</div>
                <div className="text-xs">Per {recipe.yieldUnit}</div>
              </div>
            </div>
          </div>

          {/* Allergens Button */}
          {allAllergens.length > 0 && (
            <div className="relative mb-3">
              <button
                onMouseEnter={() => setShowAllergensPopup(true)}
                onMouseLeave={() => setShowAllergensPopup(false)}
                className="w-full bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    Allergens ({allAllergens.length})
                  </div>
                </div>
              </button>
              
              {/* Allergens Popup */}
              {showAllergensPopup && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[250px]">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Allergens Present</div>
                    <div className="text-xs text-gray-700 space-y-1">
                      {allAllergens.map((allergen, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>{allergen}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
            <div className="text-center">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Notes</div>
              {isLocked ? (
                <div className="text-xs text-blue-700 min-h-[1.5rem]">
                  {notes || 'No notes added'}
                </div>
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs text-blue-700 bg-transparent border-none resize-none focus:outline-none min-h-[1.5rem]"
                  placeholder="Add recipe notes..."
                />
              )}
            </div>
          </div>
        </div>
                
        {/* Right Panel - Recipe Steps Carousel with Inline Editing */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className={`transition-all duration-500 ease-in-out ${isCarouselView ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-90'}`}>
            {isCarouselView ? (
            useSections ? (
              <RecipeCarousel
                sections={sections}
                checkedItems={checkedItems}
                toggleItem={toggleItem}
                getTimer={getTimer}
                startTimer={startTimer}
                recipe={recipe}
                ingredients={ingredients}
                servings={servings}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
                isLocked={isLocked}
                updateSection={updateSection}
                addSectionItem={addSectionItem}
                removeSectionItem={removeSectionItem}
                updateSectionItem={updateSectionItem}
                sensors={sensors}
                handleDragEnd={handleDragEnd}
                SortableIngredientItem={SortableIngredientItem}
                addSection={addSection}
                removeSection={removeSection}
                newlyAddedSection={newlyAddedSection}
              />
            ) : (
              <SimpleRecipeCarousel 
                recipe={recipe}
                checkedItems={checkedItems}
                toggleItem={toggleItem}
                getTimer={getTimer}
                startTimer={startTimer}
                ingredients={ingredients}
                servings={servings}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />
            )
          ) : (
            <WholeRecipeView
              recipe={recipe}
              checkedItems={checkedItems}
              toggleItem={toggleItem}
              ingredients={ingredients}
              servings={servings}
              isLocked={isLocked}
              allIngredients={allIngredients}
              sections={sections}
              updateSection={updateSection}
              addSectionItem={addSectionItem}
              removeSectionItem={removeSectionItem}
              updateSectionItem={updateSectionItem}
              sensors={sensors}
              handleDragEnd={handleDragEnd}
              SortableIngredientItem={SortableIngredientItem}
              method={method}
              setMethod={setMethod}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Whole Recipe View Component
function WholeRecipeView({
  recipe,
  checkedItems,
  toggleItem,
  ingredients,
  servings,
  isLocked,
  allIngredients,
  sections,
  updateSection,
  addSectionItem,
  removeSectionItem,
  updateSectionItem,
  sensors,
  handleDragEnd,
  SortableIngredientItem,
  method,
  setMethod
}: {
  recipe: any;
  checkedItems: Set<string>;
  toggleItem: (itemId: string) => void;
  ingredients: Ingredient[];
  servings: number;
  isLocked: boolean;
  allIngredients: any[];
  sections: RecipeSection[];
  updateSection: (sectionId: string, field: string, value: any) => void;
  addSectionItem: (sectionId: string, e?: React.MouseEvent) => void;
  removeSectionItem: (sectionId: string, itemId: string) => void;
  updateSectionItem: (sectionId: string, itemId: string, field: string, value: any) => void;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  SortableIngredientItem: any;
  method: string;
  setMethod: (method: string) => void;
}) {
  // Aggregate ingredients by combining quantities of same ingredient
  const aggregatedIngredients = useMemo(() => {
    const ingredientMap = new Map<number, { ingredient: Ingredient; totalQuantity: number; unit: string; items: any[] }>();
    
    allIngredients.forEach(item => {
      const ingredientId = 'ingredientId' in item ? item.ingredientId : item.ingredient.id;
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (!ingredient) return;
      
      const quantity = parseFloat('quantity' in item ? item.quantity : item.quantity.toString()) || 0;
      
      if (ingredientMap.has(ingredient.id)) {
        const existing = ingredientMap.get(ingredient.id)!;
        existing.totalQuantity += quantity;
        existing.items.push(item);
      } else {
        ingredientMap.set(ingredient.id, {
          ingredient,
          totalQuantity: quantity,
          unit: 'unit' in item ? item.unit : item.unit,
          items: [item]
        });
      }
    });
    
    return Array.from(ingredientMap.values());
  }, [allIngredients, ingredients]);

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content - No Header */}
      <div className="flex-1 p-6">
        {/* Two Column Layout: Ingredients Left, Instructions Right */}
        <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Column - Aggregated Ingredients */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 flex-shrink-0">
            <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ingredients</h3>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto md:max-h-[calc(100vh-200px)] ingredients-pane">
            {isLocked ? (
              // Locked view - show aggregated ingredients with section breakdown
              aggregatedIngredients.map((agg, index) => {
                const scaledQuantity = (agg.totalQuantity * (servings / recipe.yieldQuantity)).toFixed(1);
                const isChecked = agg.items.some(item => checkedItems.has(item.id));
                
                return (
                  <div 
                    key={agg.ingredient.id}
                    className={`rounded-lg transition-colors ${
                      isChecked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                    }`}
                  >
                    {/* Main ingredient header - clickable */}
                    <div 
                      onClick={() => agg.items.forEach(item => toggleItem(item.id))}
                      className="flex items-center gap-4 p-4 cursor-pointer touch-manipulation"
                    >
                      <div className={`w-8 h-8 rounded border-2 flex items-center justify-center touch-manipulation ${
                        isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                      }`}>
                        {isChecked && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">{scaledQuantity}</span>
                          <span className="text-base text-gray-600">{agg.unit}</span>
                          <span className="text-base text-gray-900">{agg.ingredient.name}</span>
                        </div>
                        {agg.items.length > 1 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Used in {agg.items.length} section{agg.items.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Section breakdown - only show if used in multiple sections */}
                    {agg.items.length > 1 && (
                      <div className="px-4 pb-3">
                        <div className="border-t border-gray-200 pt-4">
                          <div className="text-xs font-medium text-gray-600 mb-3">Split between sections:</div>
                          <div className="space-y-2">
                            {agg.items.map((item, itemIndex) => {
                              const section = sections.find(s => s.items.some(i => i.id === item.id));
                              if (!section) return null;
                              
                              const itemQuantity = parseFloat('quantity' in item ? item.quantity : item.quantity.toString()) || 0;
                              const scaledItemQuantity = (itemQuantity * (servings / recipe.yieldQuantity)).toFixed(1);
                              const itemUnit = 'unit' in item ? item.unit : item.unit;
                              
                              return (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {sections.findIndex(s => s.id === section.id) + 1}
                                      </span>
                                    </div>
                                    <span className="text-gray-600">{section.title}</span>
                                  </div>
                                  <span className="font-medium text-gray-800">
                                    {scaledItemQuantity} {itemUnit}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Unlocked view - show ingredients grouped by section with dividers
              <div className="space-y-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {sections.map((section, sectionIndex) => (
                  <div key={section.id} className="relative">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {sectionIndex + 1}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800">{section.title}</h4>
                        <span className="text-sm text-gray-500">({section.items.length} ingredients)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => addSectionItem(section.id, e)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Ingredient
                        </button>
                        {sections.length > 1 && (
                          <button
                            onClick={(e) => {
                              // Remove section functionality - you'll need to implement this
                              console.log('Remove section:', section.id);
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Section
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Section Ingredients */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={section.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-3">
                            {section.items.map((item) => {
                              const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
                              if (!ingredient) return null;
                              
                              return (
                                <SortableIngredientItem
                                  key={item.id}
                                  item={item}
                                  sectionId={section.id}
                                  ingredients={ingredients}
                                  onUpdate={(field: string, value: any) => updateSectionItem(section.id, item.id, field, value)}
                                  onRemove={() => removeSectionItem(section.id, item.id)}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                    
                    {/* Subtle divider line (except for last section) */}
                    {sectionIndex < sections.length - 1 && (
                      <div className="mt-4 mb-4 border-t border-gray-100"></div>
                    )}
                  </div>
                ))}
                
                {/* Add New Section Button */}
                <div className="pt-4 pb-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Add section functionality - you'll need to implement this
                      console.log('Add new section');
                    }}
                    className="w-full px-4 py-3 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Section
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Complete Instructions */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 flex-shrink-0">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Instructions</h3>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 overflow-y-auto md:max-h-[calc(100vh-200px)] instructions-pane">
            {isLocked ? (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={section.id} className="relative">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800">{section.title}</h4>
                    </div>
                    
                    {/* Section Instructions */}
                    <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap pl-9">
                      {section.method || 'No instructions provided for this step.'}
                    </div>
                    
                    {/* Subtle divider line (except for last section) */}
                    {index < sections.length - 1 && (
                      <div className="mt-4 mb-4 border-t border-gray-100"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="relative">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {index + 1}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">{section.title}</h4>
                    </div>
                    
                    {/* Editable Section Instructions */}
                    <div className="pl-9">
                      <textarea
                        value={section.method || ''}
                        onChange={(e) => updateSection(section.id, 'method', e.target.value)}
                        className="w-full text-base leading-relaxed text-gray-700 bg-transparent border-none resize-none focus:outline-none min-h-[8rem] p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-emerald-300 focus:bg-white transition-colors"
                        placeholder={`Instructions for ${section.title}...`}
                      />
                    </div>
                    
                    {/* Subtle divider line (except for last section) */}
                    {index < sections.length - 1 && (
                      <div className="mt-4 mb-4 border-t border-gray-100"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Carousel Component for Recipes with Sections (with inline editing)
function RecipeCarousel({ 
  sections, 
  checkedItems, 
  toggleItem, 
  getTimer, 
  startTimer, 
  recipe,
  ingredients,
  servings,
  currentStep,
  setCurrentStep,
  isLocked,
  updateSection,
  addSectionItem,
  removeSectionItem,
  updateSectionItem,
  sensors,
  handleDragEnd,
  SortableIngredientItem,
  addSection,
  removeSection,
  newlyAddedSection
}: {
  sections: RecipeSection[];
  checkedItems: Set<string>;
  toggleItem: (itemId: string) => void;
  getTimer: (id: string) => any;
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => void;
  recipe: any;
  ingredients: Ingredient[];
  servings: number;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isLocked: boolean;
  updateSection: (sectionId: string, field: string, value: any) => void;
  addSectionItem: (sectionId: string, e?: React.MouseEvent) => void;
  removeSectionItem: (sectionId: string, itemId: string) => void;
  updateSectionItem: (sectionId: string, itemId: string, field: string, value: any) => void;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  SortableIngredientItem: any;
  addSection: (e?: React.MouseEvent) => void;
  removeSection: (sectionId: string, e?: React.MouseEvent) => void;
  newlyAddedSection: string | null;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const innerCarouselRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const scrollToStep = (stepIndex: number) => {
    if (isTransitioning || stepIndex === currentStep) return;
    
    setIsTransitioning(true);
    setCurrentStep(stepIndex);
    
    // Reset transition flag after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  // Sync transform position when currentStep changes
  useEffect(() => {
    if (carouselRef.current && innerCarouselRef.current) {
      const container = carouselRef.current;
      const innerContainer = innerCarouselRef.current;
      const cardWidth = container.clientWidth;
      const translateX = -currentStep * cardWidth;
      
      // Apply smooth transition with better easing
      innerContainer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      innerContainer.style.transform = `translateX(${translateX}px)`;
    }
  }, [currentStep, sections.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const startTime = Date.now();
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      // Only prevent vertical scroll if this is clearly a horizontal swipe AND significant distance
      if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 50) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;
      const velocity = Math.abs(deltaX) / deltaTime;
      
      // Improved swipe detection with velocity consideration
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.5;
      const isSignificantDistance = Math.abs(deltaX) > 50;
      const isQuickSwipe = velocity > 0.3; // pixels per ms
      const isSlowSwipe = Math.abs(deltaX) > 150;
      
      if (isHorizontalSwipe && (isSignificantDistance && (isQuickSwipe || isSlowSwipe))) {
        if (deltaX > 0 && currentStep > 0) {
          scrollToStep(currentStep - 1);
        } else if (deltaX < 0 && currentStep < sections.length - 1) {
          scrollToStep(currentStep + 1);
        }
      }
      
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };



  return (
    <div className="h-full flex flex-col relative">
      {/* Navigation Tabs */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => scrollToStep(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentStep === index
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="max-w-[120px] truncate">{section.title}</span>
              </div>
            </button>
          ))}
          <div className="text-xs text-gray-500 ml-2">
            Step {currentStep + 1} of {sections.length}
          </div>
        </div>
      </div>

      {/* Add Section Button - Floating */}
      {!isLocked && (
        <button
          onClick={addSection}
          className="absolute top-16 right-4 z-10 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      )}

      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex-1 overflow-x-hidden overflow-y-auto"
        onTouchStart={handleTouchStart}
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        <div ref={innerCarouselRef} className="flex h-full min-h-0" style={{ width: `${sections.length * 100}%` }}>
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className="flex-shrink-0 h-full min-h-0"
              style={{ 
                width: `${100 / sections.length}%`,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden'
              }}
            >
              <StepCard 
                section={section}
                index={index}
                checkedItems={checkedItems}
                toggleItem={toggleItem}
                getTimer={getTimer}
                startTimer={startTimer}
                recipe={recipe}
                ingredients={ingredients}
                servings={servings}
                isLocked={isLocked}
                updateSection={updateSection}
                addSectionItem={addSectionItem}
                removeSectionItem={removeSectionItem}
                updateSectionItem={updateSectionItem}
                removeSection={removeSection}
                sensors={sensors}
                handleDragEnd={handleDragEnd}
                SortableIngredientItem={SortableIngredientItem}
                isNewlyAdded={newlyAddedSection === section.id}
                totalSections={sections.length}
              />
            </div>
          ))}
        </div>
      </div>
                
    </div>
  );
}

// Step Card Component (with inline editing)
function StepCard({ 
  section, 
  index, 
  checkedItems, 
  toggleItem, 
  getTimer, 
  startTimer, 
  recipe,
  ingredients,
  servings,
  isLocked,
  updateSection,
  addSectionItem,
  removeSectionItem,
  updateSectionItem,
  removeSection,
  sensors,
  handleDragEnd,
  SortableIngredientItem,
  isNewlyAdded,
  totalSections
}: {
  section: RecipeSection;
  index: number;
  checkedItems: Set<string>;
  toggleItem: (itemId: string) => void;
  getTimer: (id: string) => any;
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => void;
  recipe: any;
  ingredients: Ingredient[];
  servings: number;
  isLocked: boolean;
  updateSection: (sectionId: string, field: string, value: any) => void;
  addSectionItem: (sectionId: string, e?: React.MouseEvent) => void;
  removeSectionItem: (sectionId: string, itemId: string) => void;
  updateSectionItem: (sectionId: string, itemId: string, field: string, value: any) => void;
  removeSection: (sectionId: string, e?: React.MouseEvent) => void;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  SortableIngredientItem: any;
  isNewlyAdded: boolean;
  totalSections: number;
}) {

  return (
    <div className={`h-full p-4 transition-all duration-700 ease-out ${
      isNewlyAdded 
        ? 'animate-pulse bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl shadow-lg transform scale-105' 
        : ''
    }`}>
      {/* Compact Step Header */}
      <div className="mb-3">
        <div className="flex items-center gap-3 mb-2">
          {/* Delete Section Button - on the left side of the step number */}
          {!isLocked && totalSections > 1 && (
            <button
              onClick={(e) => removeSection(section.id, e)}
              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete this section"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {index + 1}
          </div>
          
          {isLocked ? (
            <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
          ) : (
            <input
              type="text"
              value={section.title}
              onChange={(e) => updateSection(section.id, 'title', e.target.value)}
              className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none"
              placeholder="Step title..."
            />
          )}
        </div>
        
        {/* Compact Cooking Parameters */}
        {(section.bakeTemp || section.bakeTime) && (
          <div className="flex items-center gap-2 mb-4">
            {section.bakeTemp && (
              <div className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                {isLocked ? (
                  `${section.bakeTemp}°C`
                ) : (
                  <input
                    type="number"
                    value={section.bakeTemp}
                    onChange={(e) => updateSection(section.id, 'bakeTemp', e.target.value)}
                    className="bg-transparent border-b border-dashed border-orange-300 focus:border-orange-500 focus:outline-none w-16 text-center"
                    placeholder="180"
                  />
                )}
              </div>
            )}
            {section.bakeTime && (
              <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isLocked ? (
                  `${section.bakeTime}m`
                ) : (
                  <input
                    type="number"
                    value={section.bakeTime}
                    onChange={(e) => updateSection(section.id, 'bakeTime', e.target.value)}
                    className="bg-transparent border-b border-dashed border-blue-300 focus:border-blue-500 focus:outline-none w-12 text-center"
                    placeholder="25"
                  />
                )}
              </div>
            )}
            {(section.bakeTemp || section.bakeTime) && (
              <button
                onClick={() => startTimer(`section-${index}`, recipe.id, recipe.name, section.title, parseInt(section.bakeTime || '0'))}
                className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Timer
              </button>
            )}
          </div>
        )}
      </div>
                      
      {/* Two Column Layout: Ingredients Left, Instructions Right */}
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Left Column - Ingredients */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Ingredients</h3>
            </div>
            {!isLocked && (
              <button
                onClick={(e) => addSectionItem(section.id, e)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Ingredient
              </button>
            )}
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={section.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {section.items.map((item) => {
                  // Find the ingredient data
                  const ingredient = ingredients.find((ing: any) => ing.id === item.ingredientId);
                  if (!ingredient) return null;
                  
                  const scaledQuantity = (parseFloat(item.quantity) * (servings / recipe.yieldQuantity)).toFixed(1);
                  const isChecked = checkedItems.has(item.id);
                  
                  // Show original view mode design when locked
                  if (isLocked) {
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors touch-manipulation cursor-pointer bg-gray-50 hover:bg-gray-100`}
                      >
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center touch-manipulation ${
                          isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                        }`}>
                          {isChecked && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">{scaledQuantity}</span>
                            <span className="text-base text-gray-600">{item.unit}</span>
                            <span className="text-base text-gray-900">{ingredient.name}</span>
                          </div>
                          {item.note && (
                            <div className="text-xs text-gray-500 mt-1">{item.note}</div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Show new edit mode design when unlocked
                  return (
                    <SortableIngredientItem
                      key={item.id}
                      item={item}
                      sectionId={section.id}
                      ingredients={ingredients}
                      onUpdate={(field: string, value: any) => updateSectionItem(section.id, item.id, field, value)}
                      onRemove={() => removeSectionItem(section.id, item.id)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
            </div>
          </div>
        </div>
        
        {/* Right Column - Instructions */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Instructions</h3>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
            {isLocked ? (
              <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                {section.method || 'No instructions provided for this step.'}
              </div>
            ) : (
              <textarea
                value={section.method}
                onChange={(e) => updateSection(section.id, 'method', e.target.value)}
                className="w-full h-full text-lg leading-relaxed text-gray-700 bg-transparent border-none resize-none focus:outline-none"
                placeholder="Instructions for this step..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// SortableIngredientItem Component - Updated with better alignment and visual design
function SortableIngredientItem({ 
  item, 
  sectionId, 
  ingredients,
  onUpdate, 
  onRemove 
}: {
  item: RecipeItem;
  sectionId: string;
  ingredients: Ingredient[];
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 mx-2 transition-all duration-200 shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Ingredient Fields */}
        <div className="flex-1 grid grid-cols-12 gap-2 items-center">
          {/* Ingredient Search/Selection */}
          <div className="col-span-5">
            <SearchableSelect
              value={item.ingredientId}
              onChange={(value) => onUpdate('ingredientId', value)}
              placeholder="Select ingredient..."
              options={ingredients.map(ing => ({
                id: ing.id,
                name: ing.name
              }))}
              className="text-sm"
            />
          </div>

          {/* Quantity */}
          <div className="col-span-2">
            <input
              type="number"
              step="0.1"
              value={item.quantity}
              onChange={(e) => onUpdate('quantity', e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-center"
              placeholder="1.0"
            />
          </div>

          {/* Unit */}
          <div className="col-span-2">
            <select
              value={item.unit}
              onChange={(e) => onUpdate('unit', e.target.value)}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-center"
            >
              <option value="">Unit</option>
              <option value="cup">cup</option>
              <option value="tsp">tsp</option>
              <option value="tbsp">tbsp</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="l">l</option>
              <option value="oz">oz</option>
              <option value="lb">lb</option>
              <option value="large">large</option>
              <option value="medium">medium</option>
              <option value="small">small</option>
            </select>
          </div>

          {/* Price - Smaller */}
          <div className="col-span-2">
            <div className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">£</span>
              <input
                type="number"
                step="0.01"
                value={item.price || ''}
                onChange={(e) => onUpdate('price', e.target.value)}
                className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-center"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Delete Button */}
          <div className="col-span-1 flex justify-center">
            <button
              onClick={onRemove}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              title="Delete ingredient"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Note Field */}
      <div className="mt-3">
        <input
          type="text"
          value={item.note || ''}
          onChange={(e) => onUpdate('note', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          placeholder="Note (optional)"
        />
      </div>
    </div>
  );
}

// Simple Carousel for Recipes without Sections (keep original)
function SimpleRecipeCarousel({ 
  recipe, 
  checkedItems, 
  toggleItem, 
  getTimer, 
  startTimer,
  ingredients,
  servings,
  currentStep,
  setCurrentStep
}: {
  recipe: any;
  checkedItems: Set<string>;
  toggleItem: (itemId: string) => void;
  getTimer: (id: string) => any;
  startTimer: (id: string, recipeId: number, recipeName: string, stepTitle: string, minutes: number) => void;
  ingredients: Ingredient[];
  servings: number;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollToStep = (stepIndex: number) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: stepIndex * cardWidth,
        behavior: 'smooth'
      });
    }
    setCurrentStep(stepIndex);
  };

  // Sync scroll position when currentStep changes
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth;
      carouselRef.current.scrollTo({
        left: currentStep * cardWidth,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  return (
    <div className="h-full flex flex-col">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex-1 overflow-x-auto scroll-snap-x-mandatory scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        <div className="flex h-full">
          {/* Card 1: Ingredients & Instructions Combined */}
          <div 
            className="flex-shrink-0 w-full h-full"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="h-full p-8">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Recipe</h2>
                </div>
              </div>
                
              {/* Two Column Layout: Ingredients Left, Instructions Right */}
              <div className="grid grid-cols-2 gap-8 h-full">
                {/* Left Column - Ingredients */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Ingredients</h3>
                  </div>
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    {recipe.items.map((item: any) => {
                      const ingredient = ingredients.find((ing: any) => ing.id === item.ingredient.id);
                      if (!ingredient) return null;
                      
                      const scaledQuantity = (parseFloat(item.quantity) * (servings / recipe.yieldQuantity)).toFixed(1);
                      const isChecked = checkedItems.has(item.id);
                      
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-colors touch-manipulation ${
                            isChecked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center touch-manipulation ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-gray-900">{scaledQuantity}</span>
                              <span className="text-xl text-gray-600">{item.unit}</span>
                              <span className="text-xl text-gray-900">{ingredient.name}</span>
                            </div>
                            {item.note && (
                              <div className="text-sm text-gray-500 mt-1">{item.note}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column - Instructions */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Instructions</h3>
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
                    <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {recipe.method || 'No instructions provided.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* No navigation arrows needed for single-step recipe */}
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <button 
          onClick={() => scrollToStep(1)}
          disabled={currentStep === 1}
          className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:cursor-not-allowed touch-manipulation"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
