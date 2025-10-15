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
  description: string;
  method: string;
  bakeTemp: string;
  bakeTime: string;
  items: RecipeItem[];
}

interface RecipePageInlineCompleteProps {
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
        .map(s => parseInt(s.bakeTime) || 0)
        .reduce((a, b) => a + b, 0)
    : parseInt(bakeTime) || 0;
  
  // Calculate total bake temp from sections if using sections
  const displayBakeTemp = useSections && sections.length > 0
    ? Math.max(...sections.map(s => parseInt(s.bakeTemp) || 0))
    : parseInt(bakeTemp) || 0;

  // Get all ingredients for progress calculation
  const allIngredients = useMemo(() => {
    if (useSections) {
      return sections.flatMap(section => section.items);
    } else {
      return recipe.items;
    }
  }, [useSections, sections, recipe.items]);

  // Toggle item checked state
  const toggleItem = useCallback((itemId: number) => {
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <button
              onClick={() => setIsLocked(!isLocked)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isLocked 
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              {isLocked ? '🔒 Locked' : '🔓 Editing'}
              </button>
      </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
              Print
                  </button>
                  <button
              onClick={() => setIsLocked(!isLocked)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              {isLocked ? 'Edit' : 'Save'}
                  </button>
                </div>
              </div>
            </div>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex gap-6 min-h-0 p-6">
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
                  <span className="text-sm font-semibold text-orange-700">Temp: {displayBakeTemp}°C</span>
                    </div>
                  </div>
                )}
                
            {recipe.bakeTime && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  <span className="text-sm font-semibold text-blue-700">Time: {displayBakeTime} min</span>
                    </div>
                  </div>
                )}
                
            {recipe.category && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                  <span className="text-sm font-semibold text-purple-700">{recipe.category.name}</span>
                    </div>
                  </div>
                )}
                
            {recipe.storage && (
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                  <span className="text-sm font-semibold text-cyan-700">{recipe.storage.name}</span>
                    </div>
                  </div>
                )}
                
            {recipe.shelfLife && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  <span className="text-sm font-semibold text-amber-700">{recipe.shelfLife.name}</span>
                    </div>
                  </div>
        )}
      </div>

          {/* Cost Analysis */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
            <div className="text-center">
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-2">Cost Analysis</div>
              <div className="text-2xl font-bold text-emerald-700 mb-1">{formatCurrency(costBreakdown.totalCost)}</div>
              <div className="text-xs text-emerald-600">Total Cost</div>
              <div className="text-lg font-semibold text-emerald-600 mt-2">{formatCurrency(costBreakdown.costPerOutputUnit)}</div>
              <div className="text-xs text-emerald-600">Per {recipe.yieldUnit}</div>
                </div>
                  </div>
                </div>
                
        {/* Right Panel - Recipe Steps Carousel */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <h3 className="text-xl font-semibold mb-2">Recipe Steps</h3>
              <p>Carousel implementation coming soon...</p>
                </div>
                </div>
                  </div>
                </div>
                
      {/* Footer - Progress & Navigation */}
      <div className="flex-shrink-0 px-6 pb-6">
        <div className="flex items-center gap-6">
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
              disabled={true}
                                    >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
            <span className="text-lg font-semibold text-gray-700">1 / {recipe.sections.length || 2}</span>
                    <button
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600"
              disabled={true}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                          </div>
      </div>
    </div>
  );
}