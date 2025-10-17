"use client";

import { useEffect, useMemo, useState } from "react";
import { computeIngredientUsageCost, computeRecipeCost, computeCostPerOutputUnit, Unit } from "@/lib/units";
import { formatCurrency } from "@/lib/currency";
import { UnitConversionHelp } from "./UnitConversionHelp";

type IngredientOption = {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: "g" | "ml" | "each";
  packPrice: number;
  densityGPerMl: number | null;
};

type RecipeSection = {
  id: string;
  title: string;
  description: string;
  method: string;
  order: number;
  items: RecipeItem[];
};

type RecipeItem = {
  id: string;
  ingredientId: number;
  quantity: number;
  unit: Unit;
  note: string;
};

type SubRecipe = {
  id: string;
  subRecipeId: number;
  quantity: number;
  unit: Unit;
  note: string;
};

export function RecipeFormAdvanced({
  ingredients,
  recipes,
  initial,
  onSubmit,
}: {
  ingredients: IngredientOption[];
  recipes: Array<{ id: number; name: string; yieldQuantity: number; yieldUnit: "g" | "ml" | "each" }>;
  initial?: {
    name: string;
    description: string;
    yieldQuantity: number;
    yieldUnit: "g" | "ml" | "each";
    imageUrl?: string;
    method: string;
    sections: RecipeSection[];
    subRecipes: SubRecipe[];
  };
  onSubmit: (formData: FormData) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [yieldQuantity, setYieldQuantity] = useState(initial?.yieldQuantity || 1);
  const [yieldUnit, setYieldUnit] = useState<"g" | "ml" | "each">(initial?.yieldUnit || "g");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [method, setMethod] = useState(initial?.method || "");
  
  const [sections, setSections] = useState<RecipeSection[]>(
    initial?.sections || [
      {
        id: "section-1",
        title: "Main Recipe",
        description: "",
        method: "",
        order: 0,
        items: [],
      },
    ]
  );
  
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>(initial?.subRecipes || []);

  // Calculate total cost including sub-recipes
  const totalCost = useMemo(() => {
    let cost = 0;
    
    // Add ingredient costs from all sections
    sections.forEach(section => {
      section.items.forEach(item => {
        const ingredient = ingredients.find(i => i.id === item.ingredientId);
        if (ingredient) {
          cost += computeIngredientUsageCost({
            usageQuantity: item.quantity,
            usageUnit: item.unit,
            ingredient: {
              packQuantity: ingredient.packQuantity,
              packUnit: ingredient.packUnit,
              packPrice: ingredient.packPrice,
              densityGPerMl: ingredient.densityGPerMl,
            },
          });
        }
      });
    });
    
    // Add sub-recipe costs
    subRecipes.forEach(subRecipe => {
      const recipe = recipes.find(r => r.id === subRecipe.subRecipeId);
      if (recipe) {
        // Calculate cost per unit of the sub-recipe
        const subRecipeCostPerUnit = computeCostPerOutputUnit({
          totalCost: 0, // We'll need to calculate this from the sub-recipe's ingredients
          yieldQuantity: recipe.yieldQuantity
        });
        cost += subRecipeCostPerUnit * subRecipe.quantity;
      }
    });
    
    return cost;
  }, [sections, subRecipes, ingredients, recipes]);

  const costPerOutputUnit = useMemo(() => {
    return computeCostPerOutputUnit({
      totalCost,
      yieldQuantity
    });
  }, [yieldQuantity, totalCost]);

  const handleAddSection = () => {
    const newSection: RecipeSection = {
      id: `section-${Date.now()}`,
      title: `Stage ${sections.length + 1}`,
      description: "",
      method: "",
      order: sections.length,
      items: [],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<RecipeSection>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const handleAddIngredient = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newItem: RecipeItem = {
        id: `item-${Date.now()}`,
        ingredientId: ingredients[0]?.id || 0,
        quantity: 1,
        unit: "g",
        note: "",
      };
      handleUpdateSection(sectionId, {
        items: [...section.items, newItem],
      });
    }
  };

  const handleUpdateItem = (sectionId: string, itemId: string, updates: Partial<RecipeItem>) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const updatedItems = section.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      handleUpdateSection(sectionId, { items: updatedItems });
    }
  };

  const handleRemoveItem = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const updatedItems = section.items.filter(item => item.id !== itemId);
      handleUpdateSection(sectionId, { items: updatedItems });
    }
  };

  const handleAddSubRecipe = () => {
    const newSubRecipe: SubRecipe = {
      id: `subrecipe-${Date.now()}`,
      subRecipeId: recipes[0]?.id || 0,
      quantity: 1,
      unit: "g",
      note: "",
    };
    setSubRecipes([...subRecipes, newSubRecipe]);
  };

  const handleUpdateSubRecipe = (subRecipeId: string, updates: Partial<SubRecipe>) => {
    setSubRecipes(subRecipes.map(sr => sr.id === subRecipeId ? { ...sr, ...updates } : sr));
  };

  const handleRemoveSubRecipe = (subRecipeId: string) => {
    setSubRecipes(subRecipes.filter(sr => sr.id !== subRecipeId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("yieldQuantity", yieldQuantity.toString());
    formData.append("yieldUnit", yieldUnit);
    formData.append("imageUrl", imageUrl);
    formData.append("method", method);
    formData.append("sections", JSON.stringify(sections));
    formData.append("subRecipes", JSON.stringify(subRecipes));
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3" encType="multipart/form-data">
      <div className="lg:col-span-2 space-y-6">
        {/* Recipe Details */}
        <div className="bg-[var(--muted)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Recipe Details</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Recipe Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                placeholder="e.g., Chocolate Chip Cookies"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                rows={3}
                placeholder="Brief description of the recipe..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Yield Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Yield Unit</label>
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value as "g" | "ml" | "each")}
                  className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                >
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="each">each</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">Image URL (Optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </div>

        {/* Recipe Sections */}
        <div className="bg-[var(--muted)] rounded-2xl border border-[var(--border)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Recipe Sections</h2>
            <button
              type="button"
              onClick={handleAddSection}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl hover:bg-[var(--accent)] transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Section
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={section.id} className="bg-[var(--background)] rounded-xl border border-[var(--border)] p-4">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                    className="text-lg font-semibold text-[var(--foreground)] bg-transparent border-none outline-none flex-1"
                    placeholder="Section Title"
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(section.id)}
                      className="text-[var(--error)] hover:bg-[var(--error)]/10 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Description</label>
                    <textarea
                      value={section.description}
                      onChange={(e) => handleUpdateSection(section.id, { description: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                      rows={2}
                      placeholder="Brief description of this section..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Method</label>
                    <textarea
                      value={section.method}
                      onChange={(e) => handleUpdateSection(section.id, { method: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                      rows={4}
                      placeholder="Step-by-step instructions for this section..."
                    />
                  </div>
                </div>

                {/* Section Ingredients */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[var(--foreground)]">Ingredients</h4>
                    <button
                      type="button"
                      onClick={() => handleAddIngredient(section.id)}
                      className="bg-[var(--secondary)] text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--accent)] transition-colors text-sm flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Ingredient
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-[var(--muted)] rounded-lg">
                        <div className="col-span-4">
                          <select
                            value={item.ingredientId}
                            onChange={(e) => handleUpdateItem(section.id, item.id, { ingredientId: Number(e.target.value) })}
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                          >
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(section.id, item.id, { quantity: Number(e.target.value) })}
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItem(section.id, item.id, { unit: e.target.value as Unit })}
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="mg">mg</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="tsp">tsp</option>
                            <option value="tbsp">tbsp</option>
                            <option value="cup">cup</option>
                            <option value="floz">fl oz</option>
                            <option value="pint">pint</option>
                            <option value="quart">quart</option>
                            <option value="gallon">gallon</option>
                            <option value="each">each</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={item.note}
                            onChange={(e) => handleUpdateItem(section.id, item.id, { note: e.target.value })}
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                            placeholder="Note (optional)"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(section.id, item.id)}
                            className="text-[var(--error)] hover:bg-[var(--error)]/10 p-1 rounded transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Recipes */}
        <div className="bg-[var(--muted)] rounded-2xl border border-[var(--border)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Sub-Recipes</h2>
            <button
              type="button"
              onClick={handleAddSubRecipe}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-xl hover:bg-[var(--accent)] transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Sub-Recipe
            </button>
          </div>

          <div className="space-y-3">
            {subRecipes.map((subRecipe) => (
              <div key={subRecipe.id} className="grid grid-cols-12 gap-3 p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
                <div className="col-span-4">
                  <select
                    value={subRecipe.subRecipeId}
                    onChange={(e) => handleUpdateSubRecipe(subRecipe.id, { subRecipeId: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                  >
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="any"
                    value={subRecipe.quantity}
                    onChange={(e) => handleUpdateSubRecipe(subRecipe.id, { quantity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2">
                  <select
                    value={subRecipe.unit}
                    onChange={(e) => handleUpdateSubRecipe(subRecipe.id, { unit: e.target.value as Unit })}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mg">mg</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="cup">cup</option>
                    <option value="floz">fl oz</option>
                    <option value="pint">pint</option>
                    <option value="quart">quart</option>
                    <option value="gallon">gallon</option>
                    <option value="each">each</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={subRecipe.note}
                    onChange={(e) => handleUpdateSubRecipe(subRecipe.id, { note: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors"
                    placeholder="Note (optional)"
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveSubRecipe(subRecipe.id)}
                    className="text-[var(--error)] hover:bg-[var(--error)]/10 p-2 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Method */}
        <div className="bg-[var(--muted)] rounded-2xl border border-[var(--border)] p-6">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Overall Method</h2>
          <textarea
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-4 py-3 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
            rows={8}
            placeholder="Overall method and instructions for the complete recipe..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-8 py-3 rounded-xl hover:bg-[var(--accent)] transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Recipe
          </button>
        </div>
      </div>

      {/* Cost Analysis Sidebar */}
      <aside className="lg:col-span-1">
        <div className="bg-[var(--muted)] rounded-2xl border border-[var(--border)] p-6 sticky top-8">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Cost Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Total Cost:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Per {yieldUnit}:</span>
              <span className="font-semibold text-[var(--foreground)]">{formatCurrency(costPerOutputUnit)}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[var(--secondary)] rounded-xl">
            <p className="text-xs text-[var(--muted-foreground)]">
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
