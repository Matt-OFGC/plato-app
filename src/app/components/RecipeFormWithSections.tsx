"use client";

import { useEffect, useMemo, useState } from "react";
import { computeIngredientUsageCost, computeRecipeCost, computeCostPerOutputUnit, Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { UnitConversionHelp } from "./UnitConversionHelp";
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

type IngredientOption = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each" | "slices";
  packPrice: number;
  densityGPerMl: number | null;
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

export function RecipeFormWithSections({
  ingredients,
  initial,
  onSubmit,
}: {
  ingredients: IngredientOption[];
  initial?: {
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: "g" | "ml" | "each" | "slices";
    imageUrl?: string;
    method?: string;
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
  const [sections, setSections] = useState<RecipeSection[]>(initial?.sections || [
    { id: "section-1", title: "Main Ingredients", items: [], order: 0 }
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
    return sections.flatMap(section => 
      section.items.map((r) => {
        const ing = ingredients.find((i) => i.id === r.ingredientId)!;
        return {
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
    );
  }, [sections, ingredients]);

  const subtotal = useMemo(() => computeRecipeCost({ items: detailedItems }), [detailedItems]);
  const total = subtotal;
  const perOutput = useMemo(() => {
    const qty = yieldQuantity || 1;
    if (qty <= 0) return 0;
    return computeCostPerOutputUnit({ totalCost: total, yieldQuantity: qty });
  }, [total, yieldQuantity]);

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
  }

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    
    // Add sections data
    fd.set("sections", JSON.stringify(sections));
    fd.set("subRecipes", JSON.stringify(subRecipes));
    
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors" 
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors"
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recipe Sections</h2>
            <button
              type="button"
              onClick={handleAddSection}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {sections.map((section) => (
                  <SortableSection
                    key={section.id}
                    section={section}
                    ingredients={ingredients}
                    onUpdateTitle={handleUpdateSectionTitle}
                    onDeleteSection={handleDeleteSection}
                    onAddItem={handleAddItem}
                    onDeleteItem={handleDeleteItem}
                    onUpdateItem={handleUpdateItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
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
          <div className="space-y-3">
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
              <span className="font-medium text-purple-600">{formatCurrency(perOutput)}</span>
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
      </aside>
    </form>
  );
}

function SortableSection({
  section,
  ingredients,
  onUpdateTitle,
  onDeleteSection,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: {
  section: RecipeSection;
  ingredients: IngredientOption[];
  onUpdateTitle: (sectionId: string, title: string) => void;
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 rounded-xl border border-gray-200 p-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateTitle(section.id, e.target.value)}
          className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-none outline-none"
          placeholder="Section title"
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      
      <select
        value={item.ingredientId}
        onChange={(e) => onUpdate(sectionId, item.id, { ingredientId: Number(e.target.value) })}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
      >
        {ingredients.map((ing) => (
          <option key={ing.id} value={ing.id}>{ing.name}</option>
        ))}
      </select>
      
      <input
        type="number"
        step="any"
        value={item.quantity}
        onChange={(e) => onUpdate(sectionId, item.id, { quantity: Number(e.target.value) })}
        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
        placeholder="Qty"
      />
      
      <select
        value={item.unit}
        onChange={(e) => onUpdate(sectionId, item.id, { unit: e.target.value as Unit })}
        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
      >
        {["g","kg","mg","lb","oz","ml","l","pint","quart","gallon","tsp","tbsp","cup","floz","each","slices"].map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      
      <button
        type="button"
        onClick={() => onDelete(sectionId, item.id)}
        className="text-red-500 hover:text-red-700 p-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
