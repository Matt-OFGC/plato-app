"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, eachDayOfInterval, addDays, startOfWeek } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  categoryId: number | null;
}

interface Allocation {
  destination: string;
  customerId: number | null;
  quantity: number;
  notes?: string;
}

interface SelectedRecipe {
  recipe: Recipe;
  quantity: number;
  customYield?: number;
  allocations?: Allocation[];
}

interface DayScheduleItem {
  id: string;
  recipeId: number;
  recipeName: string;
  quantity: number;
  dayIndex: number;
}

interface ProductionItem {
  id: number;
  recipeId: number;
  quantity: number;
  completed: boolean;
  recipe: {
    id: number;
    name: string;
    yieldQuantity: string;
    yieldUnit: string;
  };
  allocations?: any[];
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  items: ProductionItem[];
}

interface WholesaleCustomer {
  id: number;
  name: string;
}

interface ProductionPlanEditorEnhancedProps {
  plan: ProductionPlan;
  recipes: Recipe[];
  wholesaleCustomers: WholesaleCustomer[];
  companyId: number;
}

export function ProductionPlanEditorEnhanced({
  plan,
  recipes,
  wholesaleCustomers,
  companyId,
}: ProductionPlanEditorEnhancedProps) {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'schedule'>('select');
  const [planName, setPlanName] = useState(plan.name);
  const [startDate, setStartDate] = useState(format(new Date(plan.startDate), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(plan.endDate), "yyyy-MM-dd"));
  const [planNotes, setPlanNotes] = useState(plan.notes || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<Map<number, SelectedRecipe>>(() => {
    const map = new Map<number, SelectedRecipe>();
    plan.items.forEach(item => {
      const recipe = recipes.find(r => r.id === item.recipeId);
      if (recipe) {
        map.set(item.recipeId, {
          recipe,
          quantity: item.quantity,
          customYield: item.quantity * parseFloat(recipe.yieldQuantity),
          allocations: item.allocations?.map(alloc => ({
            destination: alloc.destination,
            customerId: alloc.customerId,
            quantity: parseFloat(alloc.quantity),
            notes: alloc.notes || "",
          })) || [],
        });
      }
    });
    return map;
  });
  const [daySchedule, setDaySchedule] = useState<DayScheduleItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAllocations, setShowAllocations] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const days = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const selectedByCategory = Array.from(selectedRecipes.values()).reduce((acc, item) => {
    const category = item.recipe.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SelectedRecipe[]>);

  function addRecipe(recipe: Recipe) {
    const current = selectedRecipes.get(recipe.id);
    const newMap = new Map(selectedRecipes);
    newMap.set(recipe.id, {
      recipe,
      quantity: current ? current.quantity + 1 : 1,
      customYield: current 
        ? (current.quantity + 1) * parseFloat(recipe.yieldQuantity)
        : parseFloat(recipe.yieldQuantity),
      allocations: current?.allocations || [],
    });
    setSelectedRecipes(newMap);
  }

  function removeRecipe(recipeId: number) {
    const newMap = new Map(selectedRecipes);
    newMap.delete(recipeId);
    setSelectedRecipes(newMap);
  }

  function updateQuantity(recipeId: number, quantity: number) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newMap = new Map(selectedRecipes);
    if (quantity <= 0) {
      newMap.delete(recipeId);
    } else {
      newMap.set(recipeId, { 
        ...current, 
        quantity,
        customYield: quantity * parseFloat(current.recipe.yieldQuantity),
      });
    }
    setSelectedRecipes(newMap);
  }

  function updateCustomYield(recipeId: number, customYield: number) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newMap = new Map(selectedRecipes);
    const recipeYield = parseFloat(current.recipe.yieldQuantity);
    const batches = customYield / recipeYield;
    
    newMap.set(recipeId, { 
      ...current, 
      customYield: customYield > 0 ? customYield : undefined,
      quantity: batches,
    });
    setSelectedRecipes(newMap);
  }

  function updateAllocation(recipeId: number, allocations: Allocation[]) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newMap = new Map(selectedRecipes);
    newMap.set(recipeId, { ...current, allocations });
    setSelectedRecipes(newMap);
  }

  function addAllocation(recipeId: number) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newAllocations = [...(current.allocations || []), {
      destination: "internal",
      customerId: null,
      quantity: 1,
      notes: "",
    }];
    
    updateAllocation(recipeId, newAllocations);
  }

  function removeAllocation(recipeId: number, index: number) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newAllocations = (current.allocations || []).filter((_, i) => i !== index);
    updateAllocation(recipeId, newAllocations);
  }

  function updateAllocationField(recipeId: number, index: number, field: keyof Allocation, value: any) {
    const current = selectedRecipes.get(recipeId);
    if (!current || !current.allocations) return;
    
    const newAllocations = current.allocations.map((alloc, i) => 
      i === index ? { ...alloc, [field]: value } : alloc
    );
    
    updateAllocation(recipeId, newAllocations);
  }

  function proceedToSchedule() {
    if (selectedRecipes.size === 0) {
      alert("Please select at least one recipe");
      return;
    }

    // Initialize day schedule with all recipes on the first day
    const items: DayScheduleItem[] = [];
    selectedRecipes.forEach((selected) => {
      items.push({
        id: `recipe-${selected.recipe.id}`,
        recipeId: selected.recipe.id,
        recipeName: selected.recipe.name,
        quantity: selected.quantity,
        dayIndex: 0,
      });
    });

    setDaySchedule(items);
    setStep('schedule');
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const targetDayStr = over.id as string;
    
    if (targetDayStr.startsWith('day-')) {
      const dayIndex = parseInt(targetDayStr.replace('day-', ''));
      setDaySchedule(items =>
        items.map(item =>
          item.id === itemId ? { ...item, dayIndex } : item
        )
      );
    }
  }

  async function handleSave() {
    if (!planName) {
      alert("Please enter a plan name");
      return;
    }

    const items = Array.from(selectedRecipes.entries()).map(([recipeId, selected]) => ({
      recipeId,
      quantity: selected.quantity,
      allocations: selected.allocations || [],
    }));

    setSaving(true);

    try {
      const res = await fetch(`/api/production/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          notes: planNotes || null,
          items,
        }),
      });

      if (res.ok) {
        router.push(toAppRoute("/dashboard/production"));
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update plan");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  function SortableItem({ item }: { item: DayScheduleItem }) {
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

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-400 hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <div className="flex-1">
            <p className="font-medium text-gray-900 text-sm">{item.recipeName}</p>
            <p className="text-xs text-gray-500">{item.quantity.toFixed(1)} batch{item.quantity !== 1 ? 'es' : ''}</p>
          </div>
        </div>
      </div>
    );
  }

  function DroppableDay({ dayIndex, date }: { dayIndex: number; date: Date }) {
    const dayItems = daySchedule.filter(item => item.dayIndex === dayIndex);
    const { setNodeRef, isOver } = useSortable({ id: `day-${dayIndex}` });

    return (
      <div
        ref={setNodeRef}
        className={`p-4 bg-gray-50 rounded-lg border-2 border-dashed min-h-[200px] transition-colors ${
          isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <h4 className="font-semibold text-gray-900 mb-3">
          {format(date, 'EEEE, MMM d')}
        </h4>
        <div className="space-y-2">
          {dayItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Drag items here
            </p>
          ) : (
            <SortableContext items={dayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {dayItems.map(item => (
                <SortableItem key={item.id} item={item} />
              ))}
            </SortableContext>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Production Plan</h2>
            <p className="text-gray-600 mt-1">
              {step === 'select' ? 'Update recipes and quantities' : 'Organize by day (optional)'}
            </p>
          </div>
          <button
            onClick={() => router.push(toAppRoute("/dashboard/production"))}
            className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${step === 'select' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="font-medium">Select Recipes</span>
          </div>
          <div className="flex-1 h-1 bg-gray-200 mx-2">
            <div className={`h-full bg-green-600 transition-all ${step === 'schedule' ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`flex items-center gap-2 ${step === 'schedule' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'schedule' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="font-medium">Schedule (Optional)</span>
          </div>
        </div>
      </div>

      {step === 'select' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Recipe Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Plan Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Add any notes or special instructions..."
                />
              </div>
            </div>

            {/* Recipe Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add Recipes</h3>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
              />

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredRecipes.map((recipe) => {
                  const selected = selectedRecipes.get(recipe.id);
                  const isSelected = !!selected;
                  
                  return (
                    <div
                      key={recipe.id}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                        <p className="text-sm text-gray-500">
                          {recipe.yieldQuantity} {recipe.yieldUnit} per batch
                          {recipe.category && ` • ${recipe.category}`}
                        </p>
                      </div>
                      <button
                        onClick={() => addRecipe(recipe)}
                        className={`ml-4 p-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Recipes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <span>Selected Recipes</span>
              <span className="text-sm font-normal text-gray-600">
                {selectedRecipes.size} recipe{selectedRecipes.size !== 1 ? 's' : ''}
              </span>
            </h3>
            
            {selectedRecipes.size === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm">No recipes selected yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(selectedByCategory).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {category}
                    </h4>
                    {items.map((item) => (
                      <div key={item.recipe.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{item.recipe.name}</p>
                          </div>
                          <button
                            onClick={() => removeRecipe(item.recipe.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 whitespace-nowrap">Batches:</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantity || ""}
                              onChange={(e) => {
                                const batches = parseFloat(e.target.value) || 0;
                                updateQuantity(item.recipe.id, batches);
                              }}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            />
                            <span className="text-xs text-gray-500">
                              = {(item.quantity * parseFloat(item.recipe.yieldQuantity)).toFixed(1)} {item.recipe.yieldUnit}
                            </span>
                          </div>
                          {item.allocations && item.allocations.length > 0 && (
                            <div className="text-xs">
                              <p className="text-gray-600 mb-1">Allocated: {item.allocations.reduce((sum, a) => sum + a.quantity, 0).toFixed(1)} {item.recipe.yieldUnit}</p>
                              <p className="text-blue-600">
                                Extra: {Math.max(0, (item.quantity * parseFloat(item.recipe.yieldQuantity)) - item.allocations.reduce((sum, a) => sum + a.quantity, 0)).toFixed(1)} {item.recipe.yieldUnit}
                              </p>
                            </div>
                          )}
                          
                          {/* Allocations Section */}
                          <div className="pt-2 border-t border-gray-200">
                            <button
                              onClick={() => setShowAllocations(showAllocations === item.recipe.id ? null : item.recipe.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <svg className={`w-3 h-3 transition-transform ${showAllocations === item.recipe.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              Customer Splits {item.allocations && item.allocations.length > 0 && `(${item.allocations.length})`}
                            </button>
                            
                            {showAllocations === item.recipe.id && (
                              <div className="mt-2 space-y-2">
                                {(item.allocations || []).map((alloc, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                                    <select
                                      value={alloc.customerId || alloc.destination}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "internal") {
                                          updateAllocationField(item.recipe.id, idx, "destination", val);
                                          updateAllocationField(item.recipe.id, idx, "customerId", null);
                                        } else {
                                          const custId = parseInt(val);
                                          const customer = wholesaleCustomers.find(c => c.id === custId);
                                          updateAllocationField(item.recipe.id, idx, "destination", customer?.name || "");
                                          updateAllocationField(item.recipe.id, idx, "customerId", custId);
                                        }
                                      }}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="internal">Internal</option>
                                      {wholesaleCustomers.map(cust => (
                                        <option key={cust.id} value={cust.id}>{cust.name}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      min="0"
                                      value={alloc.quantity}
                                      onChange={(e) => updateAllocationField(item.recipe.id, idx, "quantity", parseFloat(e.target.value) || 0)}
                                      placeholder="Qty"
                                      className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={() => removeAllocation(item.recipe.id, idx)}
                                      className="p-1 text-red-500 hover:text-red-700"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addAllocation(item.recipe.id)}
                                  className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors font-medium"
                                >
                                  + Add Customer Split
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Schedule View with Drag & Drop */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">
              Drag recipes to different days to organize your production schedule (optional).
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <SortableContext items={days.map((_, i) => `day-${i}`)} strategy={verticalListSortingStrategy}>
                {days.map((date, index) => (
                  <DroppableDay key={index} dayIndex={index} date={date} />
                ))}
              </SortableContext>
            </div>
          </div>
          
          <DragOverlay>
            {activeId ? (
              <div className="p-3 bg-white border-2 border-blue-500 rounded-lg shadow-xl">
                <p className="font-medium text-gray-900">Dragging...</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Footer Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        {step === 'select' ? (
          <>
            <button
              onClick={() => router.push(toAppRoute("/dashboard/production"))}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || selectedRecipes.size === 0 || !planName}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={proceedToSchedule}
                disabled={selectedRecipes.size === 0 || !planName}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Schedule →
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back to Selection
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Production Plan"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

