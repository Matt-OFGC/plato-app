"use client";

import Link from "next/link";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

interface RecipeCardProps {
  id: number;
  name: string;
  totalCost: number;
  portionsPerBatch: number;
  currency?: string;
}

export function RecipeCard({
  id,
  name,
  totalCost,
  portionsPerBatch,
  currency = "GBP",
}: RecipeCardProps) {
  const { toAppRoute } = useAppAwareRoute();
  const isSingleServing = portionsPerBatch === 1;
  const costPerServing = totalCost / portionsPerBatch;
  const currencySymbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "€";

  return (
    <Link href={toAppRoute(`/dashboard/recipes/${id}`)}>
      <div className="card-responsive border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all duration-200 cursor-pointer group touch-target">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-responsive-body font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors flex-1">
            {name}
          </h3>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {isSingleServing ? (
          /* Single Serving */
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                {currencySymbol}{totalCost.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">per serving</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Single serving recipe
            </div>
          </div>
        ) : (
          /* Batch Recipe */
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                {currencySymbol}{costPerServing.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">per serving</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                Makes {portionsPerBatch} servings
              </span>
              <span className="text-gray-500">
                {currencySymbol}{totalCost.toFixed(2)} total
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Batch recipe
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

