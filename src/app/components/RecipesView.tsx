"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";
type SortField = 'name' | 'category' | 'yield' | 'sellPrice' | 'cogs' | 'totalSteps' | 'totalTime';
type SortDirection = 'asc' | 'desc';

interface Recipe {
  id: number;
  name: string;
  description: string | null;
  yieldQuantity: any;
  yieldUnit: string;
  imageUrl: string | null;
  bakeTime: number | null;
  bakeTemp: number | null;
  storage: string | null;
  category: string | null;
  categoryRef: { name: string; color: string | null } | null;
  items: any[];
  sellingPrice: number | null;
  cogsPercentage: number | null;
  totalSteps: number;
  totalTime: number | null;
}

interface RecipesViewProps {
  recipes: Recipe[];
  selectedIds?: Set<number>;
  onSelect?: (id: number) => void;
  onSelectAll?: () => void;
  isSelecting?: boolean;
}

export function RecipesView({ recipes, selectedIds = new Set(), onSelect, onSelectAll, isSelecting = false }: RecipesViewProps) {
  const { toAppRoute } = useAppAwareRoute();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'category':
          aValue = (a.categoryRef?.name || a.category || '').toLowerCase();
          bValue = (b.categoryRef?.name || b.category || '').toLowerCase();
          break;
        case 'yield':
          aValue = parseFloat(a.yieldQuantity) || 0;
          bValue = parseFloat(b.yieldQuantity) || 0;
          break;
        case 'sellPrice':
          aValue = a.sellingPrice || 0;
          bValue = b.sellingPrice || 0;
          break;
        case 'cogs':
          aValue = a.cogsPercentage || 999; // Put null at end
          bValue = b.cogsPercentage || 999;
          break;
        case 'totalSteps':
          aValue = a.totalSteps;
          bValue = b.totalSteps;
          break;
        case 'totalTime':
          aValue = a.totalTime || 0;
          bValue = b.totalTime || 0;
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [recipes, sortField, sortDirection]);

  // Debug logging to verify recipe rendering
  useEffect(() => {
    console.log('[RecipesView] Recipe counts:', {
      recipesLength: recipes.length,
      sortedRecipesLength: sortedRecipes.length,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 'N/A',
    });
  }, [recipes.length, sortedRecipes.length]);
  
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No recipes yet</h3>
        <p className="text-[var(--muted-foreground)] mb-6">Create your first recipe to get started</p>
        <Link href={toAppRoute("/dashboard/recipes/new")} className="btn-primary">
          Create Recipe
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Sort Controls */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <p className="text-xs md:text-sm text-gray-600">
          Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Sort by:</span>
          <button
            onClick={() => handleSort('name')}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              sortField === 'name' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Name <SortIcon field="name" />
          </button>
          <button
            onClick={() => handleSort('category')}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              sortField === 'category' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Category <SortIcon field="category" />
          </button>
          <button
            onClick={() => handleSort('sellPrice')}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              sortField === 'sellPrice' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Price <SortIcon field="sellPrice" />
          </button>
          <button
            onClick={() => handleSort('cogs')}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              sortField === 'cogs' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            COGS <SortIcon field="cogs" />
          </button>
        </div>
      </div>

      {/* Card Grid Layout - All Screen Sizes */}
      {/* iPad optimization: Ensure proper scrolling and content fitting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 pb-8 md:pb-10 min-w-0">
        {sortedRecipes.map((r) => (
          <Link 
            key={r.id}
            href={toAppRoute(`/dashboard/recipes/${r.id}`)}
            className={`group bg-white rounded-xl border border-gray-200 p-4 md:p-6 lg:p-5 hover:shadow-lg hover:border-emerald-300 transition-all mobile-touch-target min-w-0 flex flex-col ${
              selectedIds.has(r.id) ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300' : ''
            }`}
          >
            {/* Checkbox for selection */}
            {isSelecting && (
              <div className="mb-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect?.(r.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Recipe Image/Icon */}
            <div className="w-full aspect-square mb-4 md:mb-5 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {r.imageUrl ? (
                <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 md:w-16 md:h-16 lg:w-14 lg:h-14 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>

            {/* Recipe Name */}
            <h3 className="text-base md:text-lg lg:text-base font-semibold text-gray-900 mb-1 md:mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 min-w-0 break-words flex-shrink-0">
              {r.name}
            </h3>

            {/* Description */}
            {r.description && (
              <p className="text-xs md:text-sm lg:text-xs text-gray-500 mb-3 md:mb-4 lg:mb-3 line-clamp-2 min-w-0 break-words flex-shrink-0">
                {r.description}
              </p>
            )}

            {/* Category Badge */}
            {(r.categoryRef || r.category) && (
              <div className="mb-3 min-w-0">
                <span 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium max-w-full truncate" 
                  style={{ 
                    backgroundColor: `${r.categoryRef?.color || '#3B82F6'}20` as any, 
                    color: (r.categoryRef?.color || '#3B82F6') as any 
                  }}
                  title={r.categoryRef?.name || r.category || undefined}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (r.categoryRef?.color || '#3B82F6') as any }} />
                  <span className="truncate">{r.categoryRef?.name || r.category}</span>
                </span>
              </div>
            )}

            {/* Recipe Details Grid */}
            <div className="space-y-2 md:space-y-2.5 pt-3 md:pt-4 border-t border-gray-100 min-w-0 flex-shrink-0 mt-auto">
              {/* Yield */}
              <div className="flex items-center justify-between text-sm md:text-sm lg:text-xs min-w-0 gap-2">
                <span className="text-gray-500 flex-shrink-0">Yield:</span>
                <span className="font-medium text-gray-900 truncate text-right">{String(r.yieldQuantity)} {r.yieldUnit}</span>
              </div>

              {/* Selling Price */}
              {r.sellingPrice && (
                <div className="flex items-center justify-between text-sm md:text-sm lg:text-xs min-w-0 gap-2">
                  <span className="text-gray-500 flex-shrink-0">Price:</span>
                  <span className="font-semibold text-emerald-600 truncate text-right">£{r.sellingPrice.toFixed(2)}</span>
                </div>
              )}

              {/* COGS Percentage */}
              {r.cogsPercentage !== null && (
                <div className="flex items-center justify-between text-sm md:text-sm lg:text-xs min-w-0 gap-2">
                  <span className="text-gray-500 flex-shrink-0">COGS:</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    r.cogsPercentage <= 25 ? 'bg-emerald-100 text-emerald-700' :
                    r.cogsPercentage <= 33 ? 'bg-green-100 text-green-700' :
                    r.cogsPercentage <= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.cogsPercentage.toFixed(1)}%
                  </span>
                </div>
              )}

              {/* Steps and Time */}
              <div className="flex items-center gap-2 md:gap-3 lg:gap-2 text-xs text-gray-500 pt-1 flex-wrap">
                {r.totalSteps > 0 && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {r.totalSteps} steps
                  </span>
                )}
                {r.totalTime && (
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {r.totalTime}min
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

