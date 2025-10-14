"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, eachDayOfInterval } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
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

interface RecipeSection {
  id: number;
  title: string;
  description: string | null;
  order: number;
}

interface Recipe {
  id: number;
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  category: string | null;
  categoryId: number | null;
  imageUrl: string | null;
  sections?: RecipeSection[];
}

interface Allocation {
  destination: string; // "internal", "wholesale", or customer name
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
  id: string; // unique ID for drag and drop
  type: 'recipe' | 'section';
  recipeId: number;
  sectionId?: number;
  recipeName: string;
  sectionTitle?: string;
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
}

interface ProductionTask {
  id: number;
  title: string;
  description: string | null;
  assignedTo: number | null;
  dueDate: Date | null;
  completed: boolean;
}

interface ProductionPlan {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  notes: string | null;
  items: ProductionItem[];
  tasks: ProductionTask[];
}

interface TeamMember {
  id: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface WholesaleCustomer {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
}

interface ProductionPlannerEnhancedProps {
  recipes: Recipe[];
  productionPlans: ProductionPlan[];
  teamMembers: TeamMember[];
  wholesaleCustomers: WholesaleCustomer[];
  companyId: number;
}

export function ProductionPlannerEnhanced({
  recipes,
  productionPlans: initialPlans,
  teamMembers,
  wholesaleCustomers,
  companyId,
}: ProductionPlannerEnhancedProps) {
  const searchParams = useSearchParams();
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [step, setStep] = useState<'select' | 'schedule'>(  'select');
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6), "yyyy-MM-dd"));
  const [selectedRecipes, setSelectedRecipes] = useState<Map<number, SelectedRecipe>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState(initialPlans);
  const [creating, setCreating] = useState(false);
  const [daySchedule, setDaySchedule] = useState<DayScheduleItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAllocations, setShowAllocations] = useState<number | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Check if we should load orders from URL params
  useEffect(() => {
    const fromOrders = searchParams?.get('fromOrders');
    const orderIds = searchParams?.get('orderIds');
    
    if (fromOrders === 'true' && orderIds) {
      loadOrdersIntoProduction(orderIds);
    }
  }, [searchParams]);
  
  async function loadOrdersIntoProduction(orderIdsParam: string) {
    setLoadingOrders(true);
    try {
      const ids = orderIdsParam.split(',').map(id => parseInt(id));
      
      // Fetch orders
      const promises = ids.map(id => 
        fetch(`/api/wholesale/orders/${id}`).then(r => r.json())
      );
      
      const orders = await Promise.all(promises);
      
      // Aggregate items by recipe
      const recipeMap = new Map<number, { quantity: number; customerId: number; customerName: string }[]>();
      
      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const existing = recipeMap.get(item.recipeId) || [];
          existing.push({
            quantity: item.quantity,
            customerId: order.customerId,
            customerName: order.customer.name,
          });
          recipeMap.set(item.recipeId, existing);
        });
      });
      
      // Pre-populate selected recipes with allocations
      const newSelectedRecipes = new Map<number, SelectedRecipe>();
      
      recipeMap.forEach((orderItems, recipeId) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const allocations: Allocation[] = [];
        
        // Group by customer
        const customerGroups = new Map<number, number>();
        orderItems.forEach(item => {
          const current = customerGroups.get(item.customerId) || 0;
          customerGroups.set(item.customerId, current + item.quantity);
        });
        
        customerGroups.forEach((qty, customerId) => {
          const customerName = orderItems.find(i => i.customerId === customerId)?.customerName || '';
          allocations.push({
            destination: customerName,
            customerId,
            quantity: qty * parseFloat(recipe.yieldQuantity),
            notes: '',
          });
        });
        
        newSelectedRecipes.set(recipeId, {
          recipe,
          quantity: totalQuantity,
          customYield: totalQuantity * parseFloat(recipe.yieldQuantity),
          allocations,
        });
      });
      
      setSelectedRecipes(newSelectedRecipes);
      setPlanName(`Orders Production - ${format(new Date(), "MMM d, yyyy")}`);
      setShowCreatePlan(true);
      
    } catch (error) {
      console.error('Failed to load orders:', error);
      alert('Failed to load orders into production');
    } finally {
      setLoadingOrders(false);
    }
  }

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

  // Group selected recipes by category
  const selectedByCategory = Array.from(selectedRecipes.values()).reduce((acc, item) => {
    const category = item.recipe.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SelectedRecipe[]>);

  // Get days in the date range
  const days = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  function addRecipe(recipe: Recipe) {
    const current = selectedRecipes.get(recipe.id);
    const newMap = new Map(selectedRecipes);
    newMap.set(recipe.id, {
      recipe,
      quantity: current ? current.quantity + 1 : 1,
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
      newMap.set(recipeId, { ...current, quantity });
    }
    setSelectedRecipes(newMap);
  }

  function updateCustomYield(recipeId: number, customYield: number) {
    const current = selectedRecipes.get(recipeId);
    if (!current) return;
    
    const newMap = new Map(selectedRecipes);
    newMap.set(recipeId, { ...current, customYield: customYield > 0 ? customYield : undefined });
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
      if (selected.recipe.sections && selected.recipe.sections.length > 0) {
        // Add each section as a separate item
        selected.recipe.sections.forEach((section) => {
          items.push({
            id: `recipe-${selected.recipe.id}-section-${section.id}`,
            type: 'section',
            recipeId: selected.recipe.id,
            sectionId: section.id,
            recipeName: selected.recipe.name,
            sectionTitle: section.title,
            quantity: selected.quantity,
            dayIndex: 0, // Start on day 0
          });
        });
      } else {
        // Add recipe as a single item
        items.push({
          id: `recipe-${selected.recipe.id}`,
          type: 'recipe',
          recipeId: selected.recipe.id,
          recipeName: selected.recipe.name,
          quantity: selected.quantity,
          dayIndex: 0,
        });
      }
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
    
    // Check if dropping on a day container
    if (targetDayStr.startsWith('day-')) {
      const dayIndex = parseInt(targetDayStr.replace('day-', ''));
      setDaySchedule(items =>
        items.map(item =>
          item.id === itemId ? { ...item, dayIndex } : item
        )
      );
    }
  }

  async function createProductionPlan() {
    if (!planName) {
      alert("Please enter a plan name");
      return;
    }

    // Convert day schedule to production items with allocations
    const itemsMap = new Map<number, { quantity: number; allocations?: Allocation[] }>();
    daySchedule.forEach(item => {
      const current = itemsMap.get(item.recipeId) || { quantity: 0 };
      itemsMap.set(item.recipeId, { 
        quantity: current.quantity + item.quantity,
        allocations: selectedRecipes.get(item.recipeId)?.allocations,
      });
    });

    const items = Array.from(itemsMap.entries()).map(([recipeId, data]) => ({
      recipeId,
      quantity: data.quantity,
      allocations: data.allocations || [],
    }));

    setCreating(true);

    try {
      const res = await fetch("/api/production/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          items,
          companyId,
        }),
      });

      if (res.ok) {
        const newPlan = await res.json();
        setPlans([newPlan, ...plans]);
        
        // Reset form
        setShowCreatePlan(false);
        setStep('select');
        setPlanName("");
        setSelectedRecipes(new Map());
        setDaySchedule([]);
        setSearchTerm("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create plan");
      }
    } catch (error) {
      alert("Network error");
    } finally {
      setCreating(false);
    }
  }

  async function toggleItemComplete(planId: number, itemId: number, completed: boolean) {
    try {
      const res = await fetch(`/api/production/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        setPlans(plans.map(plan => {
          if (plan.id === planId) {
            return {
              ...plan,
              items: plan.items.map(item =>
                item.id === itemId ? { ...item, completed: !completed } : item
              ),
            };
          }
          return plan;
        }));
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
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
            <p className="font-medium text-gray-900 text-sm">
              {item.recipeName}
              {item.sectionTitle && (
                <span className="text-blue-600 ml-1">→ {item.sectionTitle}</span>
              )}
            </p>
            <p className="text-xs text-gray-500">{item.quantity} batch{item.quantity !== 1 ? 'es' : ''}</p>
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
      {/* Create New Plan Button */}
      <button
        onClick={() => setShowCreatePlan(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Production Plan
      </button>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreatePlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (step === 'select') {
                setShowCreatePlan(false);
                setSelectedRecipes(new Map());
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden"
              style={{ maxWidth: step === 'select' ? '1200px' : '1400px' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-green-500 to-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {step === 'select' ? 'Select Recipes' : 'Schedule Production'}
                    </h2>
                    <p className="text-green-100 mt-1">
                      {step === 'select' 
                        ? 'Choose recipes and quantities for your production plan' 
                        : 'Drag recipes and sections to different days'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreatePlan(false);
                      setStep('select');
                      setSelectedRecipes(new Map());
                      setDaySchedule([]);
                    }}
                    className="text-white/80 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mt-4">
                  <div className={`flex items-center gap-2 ${step === 'select' ? 'text-white' : 'text-green-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select' ? 'bg-white text-green-600' : 'bg-green-400'}`}>
                      1
                    </div>
                    <span className="font-medium">Select</span>
                  </div>
                  <div className="flex-1 h-1 bg-green-400 mx-2"></div>
                  <div className={`flex items-center gap-2 ${step === 'schedule' ? 'text-white' : 'text-green-200'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'schedule' ? 'bg-white text-green-600' : 'bg-green-400/50'}`}>
                      2
                    </div>
                    <span className="font-medium">Schedule</span>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
                {step === 'select' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 divide-x divide-gray-200 min-h-[600px]">
                    {/* Left: Recipe Selection */}
                    <div className="lg:col-span-2 p-6 space-y-6">
                      {/* Plan Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan Name *
                          </label>
                          <input
                            type="text"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            placeholder="e.g., Week 42 Production"
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

                      {/* Recipe Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Search Recipes
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by name or category..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      {/* Recipe List */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Available Recipes</h3>
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
                                    {recipe.sections && recipe.sections.length > 0 && (
                                      <span className="text-blue-600 ml-1">
                                        • {recipe.sections.length} section{recipe.sections.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
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

                    {/* Right: Selected Recipes Preview */}
                    <div className="p-6 bg-gray-50">
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
                        <div className="space-y-4">
                          {Object.entries(selectedByCategory).map(([category, items]) => (
                            <div key={category} className="space-y-2">
                              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                {category}
                              </h4>
                              {items.map((item) => (
                                <div key={item.recipe.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900 text-sm">{item.recipe.name}</p>
                                      {item.recipe.sections && item.recipe.sections.length > 0 && (
                                        <p className="text-xs text-blue-600 mt-1">
                                          {item.recipe.sections.length} section{item.recipe.sections.length !== 1 ? 's' : ''}
                                        </p>
                                      )}
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
                                      <label className="text-xs text-gray-600 whitespace-nowrap">Total {item.recipe.yieldUnit}:</label>
                                      <input
                                        type="number"
                                        min="0"
                                        step={parseFloat(item.recipe.yieldQuantity)}
                                        value={item.customYield || ""}
                                        placeholder={`e.g., ${parseFloat(item.recipe.yieldQuantity) * 2}`}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value) || 0;
                                          updateCustomYield(item.recipe.id, value);
                                          // Auto-calculate batches
                                          if (value > 0) {
                                            const batches = value / parseFloat(item.recipe.yieldQuantity);
                                            updateQuantity(item.recipe.id, batches);
                                          }
                                        }}
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                                      />
                                    </div>
                                    {item.customYield && (
                                      <p className="text-xs text-green-600">
                                        = {(item.customYield / parseFloat(item.recipe.yieldQuantity)).toFixed(2)} batch{item.quantity !== 1 ? 'es' : ''}
                                      </p>
                                    )}
                                    
                                    {/* Allocations Section */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <button
                                        onClick={() => setShowAllocations(showAllocations === item.recipe.id ? null : item.recipe.id)}
                                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        <svg className={`w-3 h-3 transition-transform ${showAllocations === item.recipe.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Split by Destination {item.allocations && item.allocations.length > 0 && `(${item.allocations.length})`}
                                      </button>
                                      
                                      {showAllocations === item.recipe.id && (
                                        <div className="mt-2 space-y-2">
                                          {(item.allocations || []).map((alloc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                                              <select
                                                value={alloc.customerId || alloc.destination}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "internal" || val === "wholesale") {
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
                                                <option value="wholesale">Wholesale (General)</option>
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
                                            + Add Allocation
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
                  /* Schedule View */
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">
                        Drag recipes and their sections to assign them to specific days. This helps you organize complex multi-day bakes.
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
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
                {step === 'select' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowCreatePlan(false);
                        setSelectedRecipes(new Map());
                      }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={proceedToSchedule}
                      disabled={selectedRecipes.size === 0 || !planName}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Schedule →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setStep('select')}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      ← Back to Selection
                    </button>
                    <button
                      onClick={createProductionPlan}
                      disabled={creating}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create Production Plan"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Production Plans List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Production Plans</h2>
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-600 font-medium mb-2">No production plans yet</p>
            <p className="text-gray-500 text-sm">Create your first production plan to get started!</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(plan.startDate), "MMM d, yyyy")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.location.href = `/dashboard/production/edit/${plan.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Progress</p>
                    <p className="text-lg font-semibold text-green-600">
                      {plan.items.filter(i => i.completed).length} / {plan.items.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {plan.items.map((item: any) => {
                  const recipeYield = parseFloat(item.recipe.yieldQuantity);
                  const totalYield = parseFloat(item.quantity) * recipeYield;
                  
                  return (
                    <div key={item.id}>
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          item.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleItemComplete(plan.id, item.id, item.completed)}
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div className={`flex-1 ${item.completed ? "line-through text-gray-500" : ""}`}>
                            <p className="font-medium">{item.recipe.name}</p>
                            <p className="text-sm text-gray-600">
                              {totalYield % 1 === 0 ? totalYield : totalYield.toFixed(2)} {item.recipe.yieldUnit}
                              <span className="text-gray-400 ml-1">
                                ({parseFloat(item.quantity) % 1 === 0 ? parseFloat(item.quantity) : parseFloat(item.quantity).toFixed(2)} batch{parseFloat(item.quantity) !== 1 ? "es" : ""})
                              </span>
                            </p>
                            {item.allocations && item.allocations.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.allocations.map((alloc: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    {alloc.customer ? alloc.customer.name : alloc.destination}: {parseFloat(alloc.quantity)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

