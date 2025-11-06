'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { ViewToggle } from "./ViewToggle";
import { VirtualizedRecipeList } from "./VirtualizedList";
import { OptimizedImage } from "./OptimizedImage";

type ViewMode = 'grid' | 'list' | 'virtual';
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
  totalCost?: number;
  costPerServing?: number;
}

interface RecipesViewProps {
  recipes: Recipe[];
}

export function VirtualizedRecipesView({ recipes }: RecipesViewProps) {
  return <RecipesViewContent recipes={recipes} />;
}

// Also export as RecipesView for backward compatibility
export const RecipesView = VirtualizedRecipesView;

function RecipesViewContent({ recipes }: RecipesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
          aValue = a.cogsPercentage || 999;
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No recipes yet</h3>
        <p className="text-[var(--muted-foreground)] mb-6">Get started by creating your first recipe</p>
        <Link href="/dashboard/recipes/new" className="btn-primary">
          Create First Recipe
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </p>
        <ViewToggle 
          defaultView="grid" 
          onChange={(mode) => setViewMode(mode as ViewMode)}
          storageKey="recipes-view-mode"
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'list', label: 'List' },
            { value: 'virtual', label: 'Fast List' }
          ]}
        />
      </div>

      {/* Sort Controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { field: 'name' as SortField, label: 'Name' },
          { field: 'category' as SortField, label: 'Category' },
          { field: 'yield' as SortField, label: 'Yield' },
          { field: 'sellPrice' as SortField, label: 'Price' },
          { field: 'cogs' as SortField, label: 'COGS %' },
          { field: 'totalSteps' as SortField, label: 'Steps' },
          { field: 'totalTime' as SortField, label: 'Time' },
        ].map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
              sortField === field 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
            <SortIcon field={field} />
          </button>
        ))}
      </div>

      {/* Virtual List View - Best for large lists */}
      {viewMode === 'virtual' && (
        <VirtualizedRecipeList 
          recipes={sortedRecipes.map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            category: recipe.categoryRef?.name || recipe.category || undefined,
            totalCost: recipe.totalCost || 0,
            costPerServing: recipe.costPerServing || 0,
            imageUrl: recipe.imageUrl || undefined,
          }))}
          height={600}
          onRecipeClick={(recipe) => {
            window.location.href = `/dashboard/recipes/${recipe.id}`;
          }}
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/dashboard/recipes/${recipe.id}`} className="group">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 active:scale-95">
                {/* Recipe Image */}
                <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100">
                  <OptimizedImage
                    src={recipe.imageUrl || '/api/placeholder-image?name=recipe&size=400'}
                    alt={recipe.name}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Recipe Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {recipe.name}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  {recipe.categoryRef && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: recipe.categoryRef.color || '#10b981' }}
                      />
                      <span className="text-sm text-gray-600">{recipe.categoryRef.name}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Yield:</span>
                      <span className="ml-1 font-medium">
                        {recipe.yieldQuantity} {recipe.yieldUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Steps:</span>
                      <span className="ml-1 font-medium">{recipe.totalSteps}</span>
                    </div>
                    {recipe.sellingPrice && (
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="ml-1 font-medium">£{recipe.sellingPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {recipe.cogsPercentage && (
                      <div>
                        <span className="text-gray-500">COGS:</span>
                        <span className="ml-1 font-medium">{recipe.cogsPercentage.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  {recipe.totalTime && recipe.totalTime > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{Math.round(recipe.totalTime)} min</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/dashboard/recipes/${recipe.id}`} className="group">
              <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                {/* Recipe Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <OptimizedImage
                    src={recipe.imageUrl || '/api/placeholder-image?name=recipe&size=100'}
                    alt={recipe.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Recipe Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                    {recipe.name}
                  </h3>
                  {recipe.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {recipe.description}
                    </p>
                  )}
                  {recipe.categoryRef && (
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: recipe.categoryRef.color || '#10b981' }}
                      />
                      <span className="text-xs text-gray-500">{recipe.categoryRef.name}</span>
                    </div>
                  )}
                </div>
                
                {/* Stats */}
                <div className="text-right text-sm">
                  <div className="font-medium text-gray-900">
                    {recipe.yieldQuantity} {recipe.yieldUnit}
                  </div>
                  <div className="text-gray-500">
                    {recipe.totalSteps} steps
                  </div>
                  {recipe.sellingPrice && (
                    <div className="text-emerald-600 font-medium">
                      £{recipe.sellingPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
