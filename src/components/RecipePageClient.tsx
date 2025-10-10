"use client";

import { useState } from "react";
import { RecipeCookingView } from "./RecipeCookingView";
import { RecipeFormSimplified } from "./RecipeFormSimplified";
import { Unit } from "@/generated/prisma";

interface Ingredient {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
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

interface RecipePageClientProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
    categoryId?: number | null;
    shelfLifeId?: number | null;
    storageId?: number | null;
    bakeTime?: number | null;
    bakeTemp?: number | null;
    sections: Array<{
      id: number;
      title: string;
      description?: string;
      method?: string;
      order: number;
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
  onSubmit: (data: FormData) => Promise<void>;
}

export function RecipePageClient({
  recipe,
  costBreakdown,
  ingredients,
  categories,
  shelfLifeOptions,
  storageOptions,
  onSubmit,
}: RecipePageClientProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (data: FormData) => {
    await onSubmit(data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    // Prepare initial data for the form
    const initialData = {
      name: recipe.name,
      recipeType: (recipe.yieldUnit === "each" ? "single" : "batch") as "single" | "batch",
      servings: recipe.yieldQuantity,
      method: recipe.method || "",
      imageUrl: recipe.imageUrl || "",
      categoryId: recipe.categoryId || undefined,
      shelfLifeId: recipe.shelfLifeId || undefined,
      storageId: recipe.storageId || undefined,
      bakeTime: recipe.bakeTime || undefined,
      bakeTemp: recipe.bakeTemp || undefined,
      items: recipe.sections.length > 0
        ? recipe.sections.flatMap(section =>
            section.items.map(item => ({
              ingredientId: item.ingredient.id,
              quantity: item.quantity.toString(),
              unit: item.unit as Unit,
            }))
          )
        : recipe.items.map(item => ({
            ingredientId: item.ingredient.id,
            quantity: item.quantity.toString(),
            unit: item.unit as Unit,
          })),
    };

    return (
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe: {recipe.name}</h1>
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
        
        <RecipeFormSimplified
          ingredients={ingredients}
          categories={categories}
          shelfLifeOptions={shelfLifeOptions}
          storageOptions={storageOptions}
          onSubmit={handleSave}
          initial={initialData}
        />
      </div>
    );
  }

  // View mode
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <a 
          href="/dashboard/recipes" 
          className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Recipes
        </a>
        
        <button
          onClick={handleEdit}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Recipe
        </button>
      </div>

      <RecipeCookingView recipe={recipe} costBreakdown={costBreakdown} />
    </div>
  );
}

