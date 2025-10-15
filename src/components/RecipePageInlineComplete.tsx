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

  // Navigation functions
  const goToPreviousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1));
  }, [totalSteps]);

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
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-y-auto">
          {/* Recipe Image */}
                {(recipe.imageUrl || imageUrl) && (
            <div className="mb-6">
                    <img 
                      src={imageUrl || recipe.imageUrl || ""} 
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
                  className="w-16 h-16 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700 touch-manipulation"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="text-4xl font-bold text-gray-900 min-w-[4rem] text-center">{servings}</span>
                    <button 
                      onClick={() => setServings(servings + 1)}
                  className="w-16 h-16 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors text-emerald-700 touch-manipulation"
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
                
        {/* Right Panel - Recipe Steps Carousel or Edit Mode */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLocked ? (
            // Cooking Mode - Carousel
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
            // Edit Mode - Traditional Scrollable Layout
            <EditModeContent 
              recipe={recipe}
              costBreakdown={costBreakdown}
              ingredients={ingredients}
              categories={categories}
              shelfLifeOptions={shelfLifeOptions}
              storageOptions={storageOptions}
              wholesaleProduct={wholesaleProduct}
              onSave={onSave}
            />
          )}
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
              onClick={goToPreviousStep}
              disabled={currentStep === 0}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
            </button>
            <span className="text-lg font-semibold text-gray-700">
              {currentStep + 1} / {totalSteps}
            </span>
            <button 
              onClick={goToNextStep}
              disabled={currentStep === totalSteps - 1}
              className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
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

// Carousel Component for Recipes with Sections
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
  setCurrentStep
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

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      
      // Prevent vertical scroll during horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const velocity = Math.abs(deltaX);
      
      if (velocity > 50) { // Minimum swipe distance
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
    <div className="h-full flex flex-col">
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="flex-1 overflow-x-auto scroll-snap-x-mandatory scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
        onTouchStart={handleTouchStart}
      >
        <div className="flex h-full">
          {sections.map((section, index) => (
            <div 
              key={section.id} 
              className="flex-shrink-0 w-full h-full"
              style={{ scrollSnapAlign: 'start' }}
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
              />
                        </div>
          ))}
                  </div>
                </div>
                
      {/* Navigation Arrows */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <button 
          onClick={() => scrollToStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                </div>
                
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <button 
          onClick={() => scrollToStep(Math.min(sections.length - 1, currentStep + 1))}
          disabled={currentStep === sections.length - 1}
          className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  </div>
  );
}

// Simple Carousel for Recipes without Sections
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
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Ingredients</h3>
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
                          className={`flex items-center gap-4 p-6 rounded-lg cursor-pointer transition-colors touch-manipulation ${
                            isChecked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center touch-manipulation ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                          }`}>
                            {isChecked && (
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Instructions</h3>
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
      
      {/* Navigation Arrows */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <button 
          onClick={() => scrollToStep(0)}
          disabled={currentStep === 0}
          className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                            </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <button 
          onClick={() => scrollToStep(1)}
          disabled={currentStep === 1}
          className="w-16 h-16 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    </div>
                  </div>
  );
}

// Step Card Component
function StepCard({ 
  section, 
  index, 
  checkedItems, 
  toggleItem, 
  getTimer, 
  startTimer, 
  recipe,
  ingredients,
  servings
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
}) {
  return (
    <div className="h-full p-8">
      {/* Compact Step Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {index + 1}
                    </div>
            <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    </div>
          
          {/* Compact Cooking Parameters */}
                        {(section.bakeTemp || section.bakeTime) && (
                                <div className="flex items-center gap-2">
              {section.bakeTemp && (
                <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                  </svg>
                  {section.bakeTemp}°C
                              </div>
                            )}
                            {section.bakeTime && (
                <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                  {section.bakeTime}m
                                  </div>
              )}
              {(section.bakeTemp || section.bakeTime) && (
                                    <button
                  onClick={() => startTimer(`section-${index}`, recipe.id, recipe.name, section.title, parseInt(section.bakeTime || '0'))}
                  className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-medium hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                    >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                  Timer
                                    </button>
                            )}
                          </div>
                        )}
        </div>
                      </div>
                      
      {/* Two Column Layout: Ingredients Left, Instructions Right */}
      <div className="grid grid-cols-2 gap-8 h-full">
        {/* Left Column - Ingredients */}
        <div className="flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Ingredients</h3>
          <div className="space-y-4 flex-1 overflow-y-auto">
            {section.items.map((item) => {
              const ingredient = ingredients.find((ing: any) => ing.id === item.ingredientId);
              if (!ingredient) return null;
              
              const scaledQuantity = (parseFloat(item.quantity) * (servings / recipe.yieldQuantity)).toFixed(1);
              const isChecked = checkedItems.has(item.id);
              
              return (
                <div 
                                key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center gap-4 p-6 rounded-lg cursor-pointer transition-colors touch-manipulation ${
                    isChecked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center touch-manipulation ${
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {isChecked && (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Instructions</h3>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
            <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
              {section.method || 'No instructions provided for this step.'}
                    </div>
                </div>
                      </div>
                    </div>
                </div>
  );
}

// Edit Mode Content - Full Recipe Editing Interface
function EditModeContent({ 
  recipe, 
  costBreakdown, 
  ingredients, 
  categories, 
  shelfLifeOptions, 
  storageOptions, 
  wholesaleProduct, 
  onSave 
}: RecipePageInlineCompleteProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  // Editable recipe fields
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description || "");
  const [imageUrl, setImageUrl] = useState(recipe.imageUrl || "");
  const [method, setMethod] = useState(recipe.method || "");
  const [yieldQuantity, setYieldQuantity] = useState(recipe.yieldQuantity);
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit);
  const [categoryId, setCategoryId] = useState(recipe.categoryId?.toString() || "");
  const [shelfLifeId, setShelfLifeId] = useState(recipe.shelfLifeId?.toString() || "");
  const [storageId, setStorageId] = useState(recipe.storageId?.toString() || "");
  const [bakeTime, setBakeTime] = useState(recipe.bakeTime?.toString() || "");
  const [bakeTemp, setBakeTemp] = useState(recipe.bakeTemp?.toString() || "");

  // Recipe type and wholesale
  const [recipeType, setRecipeType] = useState<'single' | 'batch'>('batch');
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

  // Simple recipe items (for non-sectioned recipes)
  const [simpleItems, setSimpleItems] = useState(
    recipe.items.map((item, idx) => ({
      id: `item-${idx}`,
      ingredientId: item.ingredient.id,
      quantity: item.quantity.toString(),
      unit: item.unit as Unit,
      note: item.note || "",
    }))
  );

  // Helper functions for sections and items
  const addSection = () => {
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
  };

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  const updateSection = (sectionId: string, field: string, value: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, [field]: value } : s
    ));
  };

  const addSectionItem = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...s.items, { id: `item-${Date.now()}`, ingredientId: 0, quantity: "", unit: "g" as Unit, note: "" }] }
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

  const addSimpleItem = () => {
    setSimpleItems([...simpleItems, { id: `item-${Date.now()}`, ingredientId: 0, quantity: "", unit: "g" as Unit, note: "" }]);
  };

  const removeSimpleItem = (itemId: string) => {
    setSimpleItems(simpleItems.filter(item => item.id !== itemId));
  };

  const updateSimpleItem = (itemId: string, field: string, value: any) => {
    setSimpleItems(simpleItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('imageUrl', imageUrl);
      formData.append('method', method);
      formData.append('yieldQuantity', yieldQuantity.toString());
      formData.append('yieldUnit', yieldUnit);
      formData.append('categoryId', categoryId);
      formData.append('shelfLifeId', shelfLifeId);
      formData.append('storageId', storageId);
      formData.append('bakeTime', bakeTime);
      formData.append('bakeTemp', bakeTemp);
      formData.append('useSections', useSections.toString());
      formData.append('recipeType', recipeType);
      formData.append('isWholesaleProduct', isWholesaleProduct.toString());
      formData.append('wholesalePrice', wholesalePrice);
      
      if (useSections) {
        formData.append('sections', JSON.stringify(sections));
      } else {
        formData.append('items', JSON.stringify(simpleItems.filter(item => item.ingredientId && item.quantity)));
      }
      
      await onSave(formData);
    } catch (error) {
      console.error('Error saving recipe:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 relative">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Recipe'}
              </button>
                      </div>
                  </div>

          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
                            <input
                              type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Yield Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Yield Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <input
                                      type="number"
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0.1"
                  step="0.1"
                  required
                                    />
                                  </div>
                                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value as Unit)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="each">each</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                  {formatCurrency(costBreakdown.totalCost)}
                </div>
              </div>
            </div>
          </div>

          {/* Cooking Parameters */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cooking Parameters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bake Temperature (°C)</label>
                                    <input
                                      type="number"
                  value={bakeTemp}
                  onChange={(e) => setBakeTemp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                                    />
                                  </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bake Time (minutes)</label>
                <input
                  type="number"
                  value={bakeTime}
                  onChange={(e) => setBakeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  min="0"
                />
                                </div>
                          </div>
                        </div>

          {/* Category and Storage */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Category & Storage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                          </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Life</label>
                <select
                  value={shelfLifeId}
                  onChange={(e) => setShelfLifeId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select shelf life</option>
                  {shelfLifeOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage</label>
                <select
                  value={storageId}
                  onChange={(e) => setStorageId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select storage</option>
                  {storageOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
                        </div>
                      </div>
                  </div>

          {/* Instructions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
            <textarea
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter detailed cooking instructions..."
            />
                          </div>

          {/* Recipe Type and Wholesale */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recipe Type & Wholesale</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Recipe Type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recipeType === 'single'}
                      onChange={() => setRecipeType('single')}
                      className="text-emerald-600"
                    />
                    <span className="text-gray-700">Single Serving</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={recipeType === 'batch'}
                      onChange={() => setRecipeType('batch')}
                      className="text-emerald-600"
                    />
                    <span className="text-gray-700">Batch Recipe</span>
                  </label>
                  <p className="text-sm text-gray-500">
                    {recipeType === 'batch' 
                      ? `Makes ${yieldQuantity} servings - great for meal prep or feeding a group.`
                      : 'Perfect for individual portions and precise scaling.'
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Wholesale Product</label>
                  <div className="space-y-3">
                  <label className="flex items-center gap-2">
                                  <input 
                                    type="checkbox" 
                      checked={isWholesaleProduct}
                      onChange={(e) => setIsWholesaleProduct(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span className="text-gray-700">Enable as wholesale product</span>
                  </label>
                  {isWholesaleProduct && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Wholesale Price</label>
                      <input
                        type="number"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                                    </div>
                  )}
                                  </div>
              </div>
            </div>
          </div>

          {/* Recipe Structure */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recipe Structure</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!useSections}
                    onChange={() => setUseSections(false)}
                    className="text-emerald-600"
                  />
                  <span className="text-gray-700">Simple Recipe (no sections)</span>
                                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={useSections}
                    onChange={() => setUseSections(true)}
                    className="text-emerald-600"
                  />
                  <span className="text-gray-700">Recipe with Sections</span>
                </label>
                  </div>
              {useSections && (
                <p className="text-sm text-gray-500">
                  Organize ingredients and instructions into separate steps for complex recipes.
                </p>
                )}
            </div>
              </div>

          {/* Ingredients and Steps */}
          {useSections ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recipe Steps</h2>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Step
                </button>
              </div>
              
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Step Instructions</label>
                  <textarea
                          value={section.method}
                          onChange={(e) => updateSection(section.id, 'method', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Instructions for this step..."
                        />
                    </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">Ingredients for this step</label>
                          <button
                            type="button"
                            onClick={() => addSectionItem(section.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Ingredient
                          </button>
                    </div>
                        
                        <div className="space-y-2">
                          {section.items.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                              <div className="col-span-4">
                                <select
                                  value={item.ingredientId || ""}
                                  onChange={(e) => updateSectionItem(section.id, item.id, 'ingredientId', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                  <option value="">Select ingredient...</option>
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                  ))}
                                </select>
              </div>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateSectionItem(section.id, item.id, 'quantity', e.target.value)}
                                placeholder="Qty"
                                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                              <select
                                value={item.unit}
                                onChange={(e) => updateSectionItem(section.id, item.id, 'unit', e.target.value)}
                                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="each">each</option>
                              </select>
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) => updateSectionItem(section.id, item.id, 'note', e.target.value)}
                                placeholder="Note (optional)"
                                className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeSectionItem(section.id, item.id)}
                                className="col-span-1 text-red-600 hover:text-red-800 p-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
            </div>
                          ))}
          </div>
                </div>
                </div>
              </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
                <button
                  type="button"
                  onClick={addSimpleItem}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Ingredient
                </button>
              </div>
              
              <div className="space-y-2">
                {simpleItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4">
                      <select
                        value={item.ingredientId || ""}
                        onChange={(e) => updateSimpleItem(item.id, 'ingredientId', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Select ingredient...</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateSimpleItem(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateSimpleItem(item.id, 'unit', e.target.value)}
                      className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="each">each</option>
                    </select>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateSimpleItem(item.id, 'note', e.target.value)}
                      placeholder="Note (optional)"
                      className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeSimpleItem(item.id)}
                      className="col-span-1 text-red-600 hover:text-red-800 p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

          {/* Edit Mode Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="text-blue-800 font-semibold mb-2">Edit Mode Active</div>
            <div className="text-blue-600 text-sm">
              Make your changes above and click "Save Recipe" to update. Switch to cooking mode to use the carousel interface.
            </div>
          </div>
        </form>
      </div>

      {/* Floating Cost Breakdown Panel */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 w-80 bg-white border-2 border-emerald-200 rounded-xl p-6 shadow-lg z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Cost:</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(costBreakdown.totalCost)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cost per {yieldUnit}:</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(costBreakdown.totalCost / yieldQuantity)}</span>
          </div>
          {isWholesaleProduct && wholesalePrice && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600">Wholesale Price:</span>
              <span className="text-lg font-bold text-blue-600">£{parseFloat(wholesalePrice).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}