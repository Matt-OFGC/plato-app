"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ViewToggle } from "./ViewToggle";

type ViewMode = 'grid' | 'list';
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
}

export function RecipesView({ recipes }: RecipesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
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
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [recipes, sortField, sortDirection]);
  
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
        <Link href="/dashboard/recipes/new" className="btn-primary">
          Create Recipe
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <p className="text-responsive-body text-gray-600">
          Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </p>
        <ViewToggle 
          defaultView="grid" 
          onChange={setViewMode}
          storageKey="recipes-view-mode"
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid-responsive-mobile">
          {sortedRecipes.map((r) => (
            <div key={r.id} className="card-responsive hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              {/* Recipe Image Placeholder */}
              <Link href={`/dashboard/recipes/${r.id}`} className="block">
                <div className="w-full h-32 sm:h-40 md:h-48 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl mb-4 flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer touch-target">
                  {r.imageUrl ? (
                    <img 
                      src={r.imageUrl} 
                      alt={r.name}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 text-emerald-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No image</p>
                    </div>
                  )}
                </div>
              </Link>

              {/* Recipe Info */}
              <div className="space-y-3">
                <div>
                  <Link href={`/dashboard/recipes/${r.id}`} className="text-responsive-body font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                    {r.name}
                  </Link>
                  {r.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-sm text-gray-500">
                    <span>Yield: {String(r.yieldQuantity)} {r.yieldUnit}</span>
                    <span>{r.items.length} ingredient{r.items.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {/* Recipe Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {r.categoryRef && (
                      <div className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.categoryRef.color || "#3B82F6" }}
                        />
                        <span className="truncate">{r.categoryRef.name}</span>
                      </div>
                    )}
                    {r.bakeTime && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{r.bakeTime}min</span>
                      </div>
                    )}
                    {r.bakeTemp && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>{r.bakeTemp}°C</span>
                      </div>
                    )}
                    {r.storage && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="truncate">{r.storage}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Link 
                    href={`/dashboard/recipes/${r.id}`}
                    className="btn-responsive-primary w-full text-center flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Open Recipe
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-responsive overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th 
                    className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Category
                      <SortIcon field="category" />
                    </div>
                  </th>
                  <th 
                    className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('yield')}
                  >
                    <div className="flex items-center gap-2">
                      Yield
                      <SortIcon field="yield" />
                    </div>
                  </th>
                  <th 
                    className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('sellPrice')}
                  >
                    <div className="flex items-center gap-2">
                      Sell Price
                      <SortIcon field="sellPrice" />
                    </div>
                  </th>
                  <th 
                    className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('cogs')}
                  >
                    <div className="flex items-center gap-2">
                      COGS %
                      <SortIcon field="cogs" />
                    </div>
                  </th>
                  <th 
                    className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('totalSteps')}
                  >
                    <div className="flex items-center gap-2">
                      Steps
                      <SortIcon field="totalSteps" />
                    </div>
                  </th>
                  <th 
                    className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('totalTime')}
                  >
                    <div className="flex items-center gap-2">
                      Total Time
                      <SortIcon field="totalTime" />
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRecipes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <Link href={`/dashboard/recipes/${r.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 truncate">
                            {r.name}
                          </div>
                          {r.description && (
                            <div className="text-xs text-gray-500 truncate">{r.description}</div>
                          )}
                          <div className="sm:hidden text-xs text-gray-500 mt-1">
                            {String(r.yieldQuantity)} {r.yieldUnit} • {r.items.length} ingredients
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                      {(r.categoryRef || r.category) && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          style={{ 
                            backgroundColor: `${r.categoryRef?.color || '#3B82F6'}20` as any, 
                            color: (r.categoryRef?.color || '#3B82F6') as any 
                          }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (r.categoryRef?.color || '#3B82F6') as any }} />
                          {r.categoryRef?.name || r.category}
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {String(r.yieldQuantity)} {r.yieldUnit}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.sellingPrice ? `£${r.sellingPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm">
                      {r.cogsPercentage !== null ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          r.cogsPercentage <= 25 ? 'bg-emerald-100 text-emerald-700' :
                          r.cogsPercentage <= 33 ? 'bg-green-100 text-green-700' :
                          r.cogsPercentage <= 40 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.cogsPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                      {r.totalSteps}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {r.totalTime ? `${r.totalTime}min` : '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/dashboard/recipes/${r.id}`}
                        className="btn-responsive-secondary text-xs"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

