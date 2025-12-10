"use client";

import { useState } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Unit } from "@/lib/units";
import { SortableIngredientItem } from "./SortableIngredientItem";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  originalUnit?: string | null;
  packPrice: number;
  densityGPerMl?: number | null;
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

interface RecipeFormIngredientsProps {
  ingredients: Ingredient[];
  useSections: boolean;
  items: RecipeItem[];
  sections: RecipeSection[];
  onUseSectionsChange: (useSections: boolean) => void;
  onItemsChange: (items: RecipeItem[]) => void;
  onSectionsChange: (sections: RecipeSection[]) => void;
}

export function RecipeFormIngredients({
  ingredients,
  useSections,
  items,
  sections,
  onUseSectionsChange,
  onItemsChange,
  onSectionsChange,
}: RecipeFormIngredientsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addIngredient = () => {
    if (ingredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.");
      return;
    }
    onItemsChange([...items, {
      id: `item-${Date.now()}`,
      ingredientId: 0,
      quantity: "0",
      unit: "g" as Unit,
      note: "",
    }]);
  };

  const removeIngredient = (id: string) => {
    onItemsChange(items.filter(item => item.id !== id));
  };

  const addSection = () => {
    onSectionsChange([...sections, {
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
    onSectionsChange(sections.filter(section => section.id !== id));
  };

  const addIngredientToSection = (sectionId: string) => {
    if (ingredients.length === 0) {
      alert("No ingredients available. Please add ingredients first.");
      return;
    }
    onSectionsChange(sections.map(section => {
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
    onSectionsChange(sections.map(section => {
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
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onItemsChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleDragEndSectionItems = (sectionId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onSectionsChange(
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

  const updateItem = (id: string, field: string, value: any) => {
    onItemsChange(items.map(i => {
      if (i.id === id) {
        const updatedItem = { ...i, [field]: value };
        if (field === 'ingredientId') {
          const selectedIngredient = ingredients.find(ing => ing.id === value);
          if (selectedIngredient && selectedIngredient.originalUnit) {
            updatedItem.unit = selectedIngredient.originalUnit as Unit;
          }
        }
        return updatedItem;
      }
      return i;
    }));
  };

  const updateSectionItem = (sectionId: string, itemId: string, field: string, value: any) => {
    onSectionsChange(sections.map(s => {
      if (s.id === sectionId) {
        return { ...s, items: s.items.map(i => {
          if (i.id === itemId) {
            const updatedItem = { ...i, [field]: value };
            if (field === 'ingredientId') {
              const selectedIngredient = ingredients.find(ing => ing.id === value);
              if (selectedIngredient && selectedIngredient.originalUnit) {
                updatedItem.unit = selectedIngredient.originalUnit as Unit;
              }
            }
            return updatedItem;
          }
          return i;
        }) };
      }
      return s;
    }));
  };

  const updateSection = (sectionId: string, field: string, value: any) => {
    onSectionsChange(sections.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
  };

  const handleToggleSections = (checked: boolean) => {
    if (checked && items.length > 0) {
      onSectionsChange([{
        id: "section-0",
        title: "Step 1",
        description: "",
        method: "",
        bakeTemp: "",
        bakeTime: "",
        items: [...items],
      }]);
    } else if (!checked && sections.length > 0 && sections[0].items.length > 0) {
      onItemsChange([...sections[0].items]);
    }
    onUseSectionsChange(checked);
  };

  return (
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
            onChange={(e) => handleToggleSections(e.target.checked)}
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
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold text-lg"
                    placeholder="Step title"
                  />
                  <textarea
                    value={section.method || ""}
                    onChange={(e) => updateSection(section.id, "method", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Instructions for this step..."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bake Temp (°C)</label>
                      <input
                        type="number"
                        value={section.bakeTemp || ""}
                        onChange={(e) => updateSection(section.id, "bakeTemp", e.target.value)}
                        placeholder="e.g. 180"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bake Time (min)</label>
                      <input
                        type="number"
                        value={section.bakeTime || ""}
                        onChange={(e) => updateSection(section.id, "bakeTime", e.target.value)}
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
                        onUpdate={(id, field, value) => updateSectionItem(section.id, id, field, value)}
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
                  onUpdate={updateItem}
                  onRemove={removeIngredient}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}






