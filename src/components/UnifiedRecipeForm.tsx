"use client";

import { useEffect, useMemo, useState } from "react";
import { computeIngredientUsageCost, computeRecipeCost, computeCostPerOutputUnit, Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";
import { CostBreakdownChart } from "@/components/CostBreakdownChart";
import { SearchableSelect } from "@/components/SearchableSelect";
import { CategorySelector } from "@/components/CategorySelector";
import { ShelfLifeSelector } from "@/components/ShelfLifeSelector";
import { StorageSelector } from "@/components/StorageSelector";
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
  DragOverEvent,
  defaultDropAnimationSideEffects,
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

type IngredientOption = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each" | "slices";
  packPrice: number;
  densityGPerMl?: number | null;
};

type RecipeSection = {
  id: string;
  title: string;
  description?: string;
  method?: string;
  items: RecipeItem[];
  order: number;
};

type RecipeItem = {
  id: string;
  ingredientId: number;
  quantity: number;
  unit: Unit;
  note?: string;
  sectionId?: string;
};

type RecipeSubRecipe = {
  id: string;
  subRecipeId: number;
  quantity: number;
  unit: Unit;
  note?: string;
};

export function UnifiedRecipeForm({
  ingredients,
  allRecipes = [],
  categories = [],
  shelfLifeOptions = [],
  storageOptions = [],
  initial,
  onSubmit,
}: {
  ingredients: IngredientOption[];
  allRecipes?: Array<{
    id: number;
    name: string;
    yieldQuantity: number;
    yieldUnit: "g" | "ml" | "each" | "slices";
    items: Array<{
      ingredientId: number;
      quantity: number;
      unit: Unit;
    }>;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    description: string | null;
    color: string | null;
  }>;
  shelfLifeOptions?: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  storageOptions?: Array<{
    id: number;
    name: string;
    description: string | null;
    icon: string | null;
  }>;
  initial?: {
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: "g" | "ml" | "each" | "slices";
    imageUrl?: string;
    method?: string;
    isSubRecipe?: boolean;
    bakeTime?: string;
    bakeTemp?: string;
    storage?: string;
    shelfLife?: string;
    category?: string;
    sections: RecipeSection[];
    subRecipes: RecipeSubRecipe[];
  };
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [yieldQuantity, setYieldQuantity] = useState(initial?.yieldQuantity || 1);
  const [yieldUnit, setYieldUnit] = useState<"g" | "ml" | "each" | "slices">(initial?.yieldUnit || "g");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [method, setMethod] = useState(initial?.method || "");
  const [isSubRecipe, setIsSubRecipe] = useState(initial?.isSubRecipe || false);
  const [bakeTime, setBakeTime] = useState(initial?.bakeTime || "");
  const [bakeTemp, setBakeTemp] = useState(initial?.bakeTemp || "");
  const [storage, setStorage] = useState(initial?.storage || "");
  const [shelfLife, setShelfLife] = useState(initial?.shelfLife || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [useSections, setUseSections] = useState(initial?.sections && initial.sections.length > 0);
  const [sections, setSections] = useState<RecipeSection[]>(initial?.sections || [
    { id: "section-1", title: "Ingredients", items: [], order: 0 }
  ]);
  const [subRecipes, setSubRecipes] = useState<RecipeSubRecipe[]>(initial?.subRecipes || []);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const detailedItems = useMemo(() => {
    const result = sections.flatMap(section => 
      section.items
        .filter((r) => r.ingredientId && r.quantity && r.unit)
        .map((r) => {
          const ing = ingredients.find((i) => i.id === r.ingredientId);
          if (!ing) {
            return null;
          }
          return {
            ingredientId: r.ingredientId,
            quantity: r.quantity as number,
            unit: r.unit as Unit,
            ingredient: {
              packQuantity: ing.packQuantity,
              packUnit: ing.packUnit,
              packPrice: ing.packPrice,
              densityGPerMl: ing.densityGPerMl,
            },
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    );
    return result;
  }, [sections, ingredients]);

  const subtotal = useMemo(() => computeRecipeCost({ items: detailedItems }), [detailedItems]);
  const total = subtotal;
  const perOutput = useMemo(() => {
    const qty = yieldQuantity || 1;
    if (qty <= 0) return 0;
    return computeCostPerOutputUnit({ totalCost: total, yieldQuantity: qty });
  }, [total, yieldQuantity]);

  function handleToggleSections() {
    const newUseSections = !useSections;
    setUseSections(newUseSections);
    
    if (newUseSections && sections.length === 0) {
      setSections([{ id: "section-1", title: "Ingredients", items: [], order: 0 }]);
    }
  }

  function handleAddSection() {
    const newSection: RecipeSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      items: [],
      order: sections.length,
    };
    setSections(prev => [...prev, newSection]);
  }

  function handleDeleteSection(sectionId: string) {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  }

  function handleUpdateSectionTitle(sectionId: string, title: string) {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, title } : s));
  }

  function handleUpdateSectionMethod(sectionId: string, method: string) {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, method } : s));
  }

  function handleAddItem(sectionId: string) {
    const newItem: RecipeItem = {
      id: `item-${Date.now()}`,
      ingredientId: ingredients[0]?.id || 0,
      quantity: 1,
      unit: "g",
    };
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, items: [...s.items, newItem] }
        : s
    ));
  }

  function handleDeleteItem(sectionId: string, itemId: string) {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.filter(i => i.id !== itemId) }
        : s
    ));
  }

  function handleUpdateItem(sectionId: string, itemId: string, updates: Partial<RecipeItem>) {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { 
            ...s, 
            items: s.items.map(i => 
              i.id === itemId ? { ...i, ...updates } : i
            )
          }
        : s
    ));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    // Handle drag over events for better visual feedback
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    // Handle section reordering
    if (active.id.toString().startsWith('section-') && over.id.toString().startsWith('section-')) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      
      if (oldIndex !== newIndex) {
        setSections(prev => {
          const newSections = arrayMove(prev, oldIndex, newIndex);
          return newSections.map((section, index) => ({ ...section, order: index }));
        });
      }
      return;
    }

    // Handle item reordering within sections
    const activeSectionId = active.data.current?.sectionId;
    const overSectionId = over.data.current?.sectionId;
    
    if (activeSectionId && overSectionId) {
      const activeSection = sections.find(s => s.id === activeSectionId);
      const overSection = sections.find(s => s.id === overSectionId);
      
      if (!activeSection || !overSection) return;

      const activeIndex = activeSection.items.findIndex(i => i.id === active.id);
      const overIndex = overSection.items.findIndex(i => i.id === over.id);

      if (activeSectionId === overSectionId) {
        // Reordering within same section
        if (activeIndex !== overIndex) {
          setSections(prev => prev.map(s => 
            s.id === activeSectionId 
              ? { ...s, items: arrayMove(s.items, activeIndex, overIndex) }
              : s
          ));
        }
      } else {
        // Moving between sections
        const activeItem = activeSection.items[activeIndex];
        if (activeItem) {
          setSections(prev => prev.map(s => {
            if (s.id === activeSectionId) {
              return { ...s, items: s.items.filter(i => i.id !== active.id) };
            } else if (s.id === overSectionId) {
              const newItems = [...s.items];
              newItems.splice(overIndex, 0, { ...activeItem, sectionId: overSectionId });
              return { ...s, items: newItems };
            }
            return s;
          }));
        }
      }
    }
    
    setActiveId(null);
  }

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    
    // Add sections data
    fd.set("sections", JSON.stringify(sections));
    fd.set("subRecipes", JSON.stringify(subRecipes));
    fd.set("useSections", (useSections ?? false).toString());
    fd.set("isSubRecipe", isSubRecipe.toString());
    
    // Add metadata fields
    fd.set("bakeTime", bakeTime);
    fd.set("bakeTemp", bakeTemp);
    fd.set("storage", storage);
    fd.set("shelfLife", shelfLife);
    fd.set("category", category);
    fd.set("categoryId", category);
    fd.set("shelfLifeId", shelfLife);
    fd.set("storageId", storage);
    
    // Add items data for non-sectioned recipes
    if (useSections === false && sections && sections.length > 0) {
      const allItems = sections.flatMap(section => section.items);
      fd.set("items", JSON.stringify(allItems));
    }
    
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3" encType="multipart/form-data">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Recipe Name</label>
              <input 
                name="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                placeholder="e.g., Millionaire's Shortbread"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
              <input 
                name="description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                placeholder="Brief description of the recipe"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Yield Quantity</label>
              <input 
                type="number" 
                step="any" 
                name="yieldQuantity" 
                value={yieldQuantity}
                onChange={(e) => setYieldQuantity(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                placeholder="8"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Yield Unit</label>
              <select 
                name="yieldUnit" 
                value={yieldUnit} 
                onChange={(e) => setYieldUnit(e.target.value as any)} 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="each">Each</option>
                <option value="slices">Slices</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Metadata</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Bake Time (minutes)</label>
              <input 
                type="number" 
                name="bakeTime" 
                value={bakeTime}
                onChange={(e) => setBakeTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                placeholder="e.g., 25"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Bake Temperature (°C)</label>
              <input 
                type="number" 
                name="bakeTemp" 
                value={bakeTemp}
                onChange={(e) => setBakeTemp(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                placeholder="e.g., 180"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Storage Instructions</label>
              <StorageSelector
                storageOptions={storageOptions}
                value={storage ? parseInt(storage) : null}
                onChange={(storageId) => setStorage(storageId ? storageId.toString() : "")}
                placeholder="Select or create storage instructions..."
                allowCreate={true}
                onCreateStorage={(name) => {
                  // This will be handled by the parent component
                  console.log("Create storage option:", name);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Shelf Life</label>
              <ShelfLifeSelector
                shelfLifeOptions={shelfLifeOptions}
                value={shelfLife ? parseInt(shelfLife) : null}
                onChange={(shelfLifeId) => setShelfLife(shelfLifeId ? shelfLifeId.toString() : "")}
                placeholder="Select or create shelf life..."
                allowCreate={true}
                onCreateShelfLife={(name) => {
                  // This will be handled by the parent component
                  console.log("Create shelf life option:", name);
                }}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
            <CategorySelector
              categories={categories}
              value={category ? parseInt(category) : null}
              onChange={(categoryId) => setCategory(categoryId ? categoryId.toString() : "")}
              placeholder="Select or create a category..."
              allowCreate={true}
              onCreateCategory={(name) => {
                // This will be handled by the parent component
                console.log("Create category:", name);
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubRecipe}
                onChange={(e) => setIsSubRecipe(e.target.checked)}
                className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Mark as Sub-Recipe</div>
                <div className="text-xs text-gray-500">This recipe can be used as an ingredient in other recipes</div>
              </div>
            </label>
          </div>
        </div>

        {allRecipes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Sub-Recipes</h2>
            <div className="text-sm text-gray-600 mb-4">
              These recipes are marked as sub-recipes and can be used as ingredients:
            </div>
            <div className="grid gap-2">
              {allRecipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{recipe.name}</div>
                    <div className="text-xs text-gray-500">
                      Yield: {recipe.yieldQuantity} {recipe.yieldUnit}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {recipe.items.length} ingredient{recipe.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Ingredients</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSections}
                  onChange={handleToggleSections}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <span className="text-sm text-gray-700">Use sections</span>
              </label>
            </div>
            {useSections && (
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Section
              </button>
            )}
          </div>

          {useSections ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 relative">
                  {sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      ingredients={ingredients}
                      onUpdateTitle={handleUpdateSectionTitle}
                      onUpdateMethod={handleUpdateSectionMethod}
                      onDeleteSection={handleDeleteSection}
                      onAddItem={handleAddItem}
                      onDeleteItem={handleDeleteItem}
                      onUpdateItem={handleUpdateItem}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.8',
                      },
                    },
                  }),
                }}
              >
                {activeId ? (() => {
                  if (activeId.startsWith('section-')) {
                    const section = sections.find(s => s.id === activeId);
                    return (
                      <div className="bg-white rounded-xl border-2 border-emerald-500 shadow-2xl p-4 opacity-95 transform rotate-1 scale-105">
                        <div className="flex items-center gap-3">
                          <div className="cursor-grabbing p-2 text-emerald-500 bg-emerald-50 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {section?.title || 'Section'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {section?.items.length || 0} ingredient{(section?.items.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Find the ingredient item being dragged
                    let draggedItem = null;
                    let sectionName = '';
                    for (const section of sections) {
                      const item = section.items.find(i => i.id === activeId);
                      if (item) {
                        draggedItem = item;
                        sectionName = section.title;
                        break;
                      }
                    }
                    
                    if (draggedItem) {
                      const ingredient = ingredients.find(i => i.id === draggedItem.ingredientId);
                      return (
                        <div className="bg-white rounded-lg border-2 border-emerald-500 shadow-xl p-3 opacity-95 transform rotate-1 scale-105">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grabbing p-1 text-emerald-500 bg-emerald-50 rounded">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ingredient?.name || 'Ingredient'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {draggedItem.quantity} {draggedItem.unit} • {sectionName}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="bg-white rounded-lg border-2 border-emerald-500 shadow-xl p-3 opacity-95 transform rotate-1 scale-105">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grabbing p-1 text-emerald-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {activeId.startsWith('section-') ? 'Section' : 'Ingredient'}
                        </div>
                      </div>
                    </div>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={sections[0]?.items.map(item => item.id) || []} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sections[0]?.items.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      sectionId={sections[0].id}
                      ingredients={ingredients}
                      onDelete={handleDeleteItem}
                      onUpdate={handleUpdateItem}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.8',
                      },
                    },
                  }),
                }}
              >
                {activeId ? (() => {
                  // Find the ingredient item being dragged
                  let draggedItem = null;
                  for (const section of sections) {
                    const item = section.items.find(i => i.id === activeId);
                    if (item) {
                      draggedItem = item;
                      break;
                    }
                  }
                  
                  if (draggedItem) {
                    const ingredient = ingredients.find(i => i.id === draggedItem.ingredientId);
                    return (
                      <div className="bg-white rounded-lg border-2 border-emerald-500 shadow-xl p-3 opacity-95 transform rotate-1 scale-105">
                        <div className="flex items-center gap-3">
                          <div className="cursor-grabbing p-1 text-emerald-500 bg-emerald-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ingredient?.name || 'Ingredient'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {draggedItem.quantity} {draggedItem.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })() : null}
              </DragOverlay>
              <button
                type="button"
                onClick={() => handleAddItem(sections[0].id)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add ingredient
              </button>
            </DndContext>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Recipe
          </button>
        </div>
      </div>

      <aside className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Analysis</h3>
          
          {/* Individual Ingredient Costs */}
          {detailedItems.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredient Costs</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {detailedItems.map((item, index) => {
                  const ingredient = ingredients.find(i => i.id === item.ingredientId);
                  const cost = computeIngredientUsageCost({
                    usageQuantity: item.quantity,
                    usageUnit: item.unit,
                    ingredient: {
                      packQuantity: item.ingredient.packQuantity,
                      packUnit: item.ingredient.packUnit,
                      packPrice: item.ingredient.packPrice,
                      densityGPerMl: item.ingredient.densityGPerMl,
                    },
                  });
                  return (
                    <div key={index} className="flex justify-between items-center text-xs py-1">
                      <span className="text-gray-600 truncate">{ingredient?.name || 'Unknown'}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(cost)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Costs */}
          {useSections && sections.length > 1 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Section Costs</h4>
              <div className="space-y-1">
                {sections.map((section) => {
                  const sectionItems = section.items
                    .filter(item => item.ingredientId && item.quantity && item.unit)
                    .map(item => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      return {
                        quantity: item.quantity,
                        unit: item.unit,
                        ingredient: {
                          packQuantity: ing?.packQuantity || 0,
                          packUnit: ing?.packUnit || "g",
                          packPrice: ing?.packPrice || 0,
                          densityGPerMl: ing?.densityGPerMl,
                        },
                      };
                    });
                  const sectionCost = computeRecipeCost({ items: sectionItems });
                  return (
                    <div key={section.id} className="flex justify-between items-center text-xs py-1">
                      <span className="text-gray-600 truncate">{section.title}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(sectionCost)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Cost</span>
              <span className="font-semibold text-lg text-gray-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Per {yieldUnit}</span>
              <span className="font-medium text-emerald-600">{formatCurrency(perOutput)}</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-800">
              💡 Costs are calculated automatically from your ingredient prices and densities.
              Unit conversions happen seamlessly in the background.
            </p>
          </div>
          <div className="mt-4">
            <UnitConversionHelp />
          </div>
        </div>
        
        {/* Cost Breakdown Pie Chart */}
        <div className="mt-6">
          <CostBreakdownChart 
            items={detailedItems}
            ingredients={ingredients}
          />
        </div>
      </aside>
    </form>
  );
}

function SortableSection({
  section,
  ingredients,
  onUpdateTitle,
  onUpdateMethod,
  onDeleteSection,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: {
  section: RecipeSection;
  ingredients: IngredientOption[];
  onUpdateTitle: (sectionId: string, title: string) => void;
  onUpdateMethod: (sectionId: string, method: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddItem: (sectionId: string) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, updates: Partial<RecipeItem>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-gray-50 rounded-xl border p-4 transition-all duration-200 ${
        isDragging 
          ? 'border-emerald-500 shadow-2xl scale-105' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-2 text-gray-400 hover:text-emerald-600 transition-all duration-200 rounded-lg hover:bg-emerald-50 hover:scale-110"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateTitle(section.id, e.target.value)}
          className="flex-1 text-lg font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-emerald-200"
          placeholder="Section title (e.g., Millionaire Base)"
        />
        <button
          type="button"
          onClick={() => onDeleteSection(section.id)}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
        <textarea
          value={section.method || ""}
          onChange={(e) => onUpdateMethod(section.id, e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-emerald-200 resize-none"
          rows={3}
          placeholder="Instructions for this section..."
        />
      </div>

      <div className="space-y-2">
        {section.items.map((item) => (
          <SortableItem
            key={item.id}
            item={item}
            sectionId={section.id}
            ingredients={ingredients}
            onDelete={onDeleteItem}
            onUpdate={onUpdateItem}
          />
        ))}
        <button
          type="button"
          onClick={() => onAddItem(section.id)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add item
        </button>
      </div>
    </div>
  );
}

function SortableItem({
  item,
  sectionId,
  ingredients,
  onDelete,
  onUpdate,
}: {
  item: RecipeItem;
  sectionId: string;
  ingredients: IngredientOption[];
  onDelete: (sectionId: string, itemId: string) => void;
  onUpdate: (sectionId: string, itemId: string, updates: Partial<RecipeItem>) => void;
}) {
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
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-3 flex items-center gap-3 transition-all duration-200 ${
        isDragging 
          ? 'border-emerald-500 shadow-xl scale-105' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-2 text-gray-400 hover:text-emerald-600 transition-all duration-200 rounded-lg hover:bg-emerald-50 hover:scale-110"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <SearchableSelect
        options={ingredients.map(ing => ({ id: ing.id, name: ing.name }))}
        value={item.ingredientId}
        onChange={(value) => onUpdate(sectionId, item.id, { ingredientId: value })}
        placeholder="Select ingredient..."
        className="flex-1"
      />
      
      <input
        type="number"
        step="any"
        value={item.quantity}
        onChange={(e) => onUpdate(sectionId, item.id, { quantity: Number(e.target.value) })}
        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-emerald-200"
        placeholder="Qty"
      />
      
      <select
        value={item.unit}
        onChange={(e) => onUpdate(sectionId, item.id, { unit: e.target.value as Unit })}
        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-emerald-200"
      >
        {["g","kg","mg","lb","oz","ml","l","pint","quart","gallon","tsp","tbsp","cup","floz","each","slices"].map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      
      {/* Cost Display */}
      {item.ingredientId && item.quantity && item.unit && (() => {
        const ingredient = ingredients.find(i => i.id === item.ingredientId);
        if (!ingredient) return null;
        
        const cost = computeIngredientUsageCost({
          usageQuantity: item.quantity,
          usageUnit: item.unit,
          ingredient: {
            packQuantity: ingredient.packQuantity,
            packUnit: ingredient.packUnit,
            packPrice: ingredient.packPrice,
            densityGPerMl: ingredient.densityGPerMl,
          },
        });
        
        return (
          <div className="text-sm font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 min-w-[60px] text-center">
            {formatCurrency(cost)}
          </div>
        );
      })()}
      
      <button
        type="button"
        onClick={() => onDelete(sectionId, item.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
        title="Delete ingredient"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
