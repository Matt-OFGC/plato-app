"use client";

import Link from "next/link";
import { checkPriceStatus, getPriceStatusColorClass, formatLastUpdate } from "@/lib/priceTracking";

interface Ingredient {
  id: number;
  name: string;
  lastPriceUpdate: Date;
  packPrice: number;
  supplier?: string;
}

interface StalePriceAlertsProps {
  ingredients: Ingredient[];
}

export function StalePriceAlerts({ ingredients }: StalePriceAlertsProps) {
  // Check all ingredients for stale prices
  const ingredientsWithStatus = ingredients.map(ing => ({
    ...ing,
    priceStatus: checkPriceStatus(new Date(ing.lastPriceUpdate))
  }));

  const staleIngredients = ingredientsWithStatus.filter(i => i.priceStatus.status === 'stale');
  const warningIngredients = ingredientsWithStatus.filter(i => i.priceStatus.status === 'warning');

  if (staleIngredients.length === 0 && warningIngredients.length === 0) {
    return null; // Don't show anything if all prices are current
  }

  return (
    <div className="space-y-4">
      {/* Stale Prices (12+ months) */}
      {staleIngredients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900">
              Outdated Prices ({staleIngredients.length})
            </h3>
            <span className="text-xs text-red-700">12+ months old</span>
          </div>
          <p className="text-sm text-red-800 mb-4">
            These ingredient prices haven't been updated in over a year. Please review and update.
          </p>
          <div className="space-y-2">
            {staleIngredients.slice(0, 5).map(ing => (
              <Link 
                key={ing.id}
                href={`/dashboard/ingredients/${ing.id}`}
                className="block bg-white rounded-lg border border-red-200 p-3 hover:border-red-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ing.name}</p>
                    <p className="text-xs text-gray-600">
                      {ing.supplier && `${ing.supplier} • `}
                      Last updated: {formatLastUpdate(new Date(ing.lastPriceUpdate))}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {staleIngredients.length > 5 && (
              <p className="text-xs text-red-700 text-center pt-2">
                + {staleIngredients.length - 5} more ingredients need updating
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning Prices (6-12 months) */}
      {warningIngredients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-amber-900">
              Review Prices ({warningIngredients.length})
            </h3>
            <span className="text-xs text-amber-700">6+ months old</span>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            These prices are getting old. Check with your suppliers for any price changes.
          </p>
          <div className="space-y-2">
            {warningIngredients.slice(0, 5).map(ing => (
              <Link 
                key={ing.id}
                href={`/dashboard/ingredients/${ing.id}`}
                className="block bg-white rounded-lg border border-amber-200 p-3 hover:border-amber-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ing.name}</p>
                    <p className="text-xs text-gray-600">
                      {ing.supplier && `${ing.supplier} • `}
                      Last updated: {formatLastUpdate(new Date(ing.lastPriceUpdate))}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {warningIngredients.length > 5 && (
              <p className="text-xs text-amber-700 text-center pt-2">
                + {warningIngredients.length - 5} more to review
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

