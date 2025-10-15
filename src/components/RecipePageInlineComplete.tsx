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
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-y-auto">
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
          {/* Card 1: Ingredients */}
          <div 
            className="flex-shrink-0 w-full h-full"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="h-full p-8">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    1
                      </div>
                  <h2 className="text-3xl font-bold text-gray-900">Ingredients</h2>
                    </div>
                </div>
                
                  <div className="space-y-4">
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
            </div>
                      
          {/* Card 2: Instructions */}
          <div 
            className="flex-shrink-0 w-full h-full"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="h-full p-8">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    2
                    </div>
                  <h2 className="text-3xl font-bold text-gray-900">Instructions</h2>
                  </div>
                </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {recipe.method || 'No instructions provided.'}
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
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {index + 1}
                            </div>
          <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                        </div>
                        
        {/* Cooking Parameters */}
                        {(section.bakeTemp || section.bakeTime) && (
          <div className="flex gap-4 mb-6">
                            {section.bakeTemp && (
              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                  </svg>
                <span className="font-semibold">Temp: {section.bakeTemp}°C</span>
                              </div>
                            )}
                            {section.bakeTime && (
              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                <span className="font-semibold">Time: {section.bakeTime} min</span>
                                  </div>
            )}
            {(section.bakeTemp || section.bakeTime) && (
                                    <button
                onClick={() => startTimer(`section-${index}`, recipe.id, recipe.name, section.title, parseInt(section.bakeTime || '0'))}
                className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-200 transition-colors"
                                    >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                <span className="font-semibold">Start Timer</span>
                                    </button>
                            )}
                          </div>
                        )}
                      </div>
                      
      {/* Ingredients Section */}
                        <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Ingredients</h3>
        <div className="space-y-4">
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

      {/* Instructions Section */}
                      <div>
        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4">Instructions</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
            {section.method || 'No instructions provided for this step.'}
                      </div>
                  </div>
                                  </div>
                                  </div>
  );
}

// Edit Mode Content (Traditional Scrollable Layout)
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
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Recipe Title and Description */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{recipe.description}</p>
          )}
                          </div>

        {/* Recipe Image */}
        {recipe.imageUrl && (
          <div className="flex justify-center">
            <img 
              src={recipe.imageUrl} 
              alt={recipe.name} 
              className="w-full max-w-md h-64 object-cover rounded-xl shadow-lg"
            />
                  </div>
                )}

        {/* Recipe Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recipe.bakeTemp && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{recipe.bakeTemp}°C</div>
              <div className="text-sm text-orange-600">Temperature</div>
                          </div>
          )}
          {recipe.bakeTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{recipe.bakeTime} min</div>
              <div className="text-sm text-blue-600">Bake Time</div>
                  </div>
                )}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{recipe.yieldQuantity}</div>
            <div className="text-sm text-purple-600">Servings</div>
              </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{formatCurrency(costBreakdown.totalCost)}</div>
            <div className="text-sm text-emerald-600">Total Cost</div>
                    </div>
                    </div>

        {/* Ingredients Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Ingredients</h2>
          <div className="space-y-3">
            {recipe.items.map((item: any) => {
              const ingredient = ingredients.find((ing: any) => ing.id === item.ingredient.id);
              if (!ingredient) return null;
              
              return (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 min-w-[4rem]">{item.quantity}</div>
                  <div className="text-lg text-gray-600 min-w-[3rem]">{item.unit}</div>
                  <div className="text-lg text-gray-900 flex-1">{ingredient.name}</div>
                  {item.note && (
                    <div className="text-sm text-gray-500 italic">({item.note})</div>
                )}
              </div>
              );
            })}
            </div>
          </div>

        {/* Instructions Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructions</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
              {recipe.method || 'No instructions provided.'}
                </div>
                </div>
              </div>

        {/* Edit Mode Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-blue-800 font-semibold mb-2">Edit Mode Active</div>
          <div className="text-blue-600 text-sm">
            This is the traditional scrollable layout for editing. Switch to cooking mode to use the carousel interface.
            </div>
          </div>
      </div>
    </div>
  );
}