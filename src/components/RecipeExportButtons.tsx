"use client";

import Link from "next/link";

interface RecipeExportButtonsProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
    sections: Array<any>;
    items: Array<any>;
  };
  costBreakdown: {
    totalCost: number;
    costPerOutputUnit: number;
  };
  servings: number;
}

export function RecipeExportButtons({ recipe, costBreakdown, servings }: RecipeExportButtonsProps) {
  return (
    <div className="flex gap-3">
      <Link
        href={`/dashboard/recipes/new?edit=${recipe.id}`}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Recipe
      </Link>
      <Link
        href={`/dashboard/recipes/${recipe.id}/print`}
        target="_blank"
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 shadow-sm font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Recipe
      </Link>
    </div>
  );
}
