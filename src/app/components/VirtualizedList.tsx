'use client';

import React, { forwardRef, useMemo } from 'react';
import { List } from 'react-window';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

// Using react-window for fixed height items
export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const Row = useMemo(() => 
    forwardRef<HTMLDivElement, { index: number; style: React.CSSProperties }>(
      ({ index, style }, ref) => (
        <div ref={ref} style={style} className="px-4 py-2">
          {renderItem(items[index], index)}
        </div>
      )
    ), [items, renderItem]
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={overscan}
      className={className}
    >
      {Row}
    </List>
  );
}

// Using @tanstack/react-virtual for dynamic height items
interface DynamicVirtualizedListProps<T> {
  items: T[];
  height: number;
  estimateSize?: (index: number) => number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export function DynamicVirtualizedList<T>({
  items,
  height,
  estimateSize = () => 50,
  renderItem,
  className = '',
  overscan = 5,
}: DynamicVirtualizedListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Pre-built components for common patterns
interface RecipeListItem {
  id: number;
  name: string;
  category?: string;
  totalCost?: number;
  costPerServing?: number;
  imageUrl?: string;
}

export function VirtualizedRecipeList({
  recipes,
  height = 400,
  onRecipeClick,
}: {
  recipes: RecipeListItem[];
  height?: number;
  onRecipeClick?: (recipe: RecipeListItem) => void;
}) {
  const renderRecipe = (recipe: RecipeListItem, index: number) => (
    <div
      key={recipe.id}
      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onRecipeClick?.(recipe)}
    >
      {recipe.imageUrl ? (
        <img
          src={recipe.imageUrl}
          alt={recipe.name}
          className="w-16 h-16 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{recipe.name}</h3>
        {recipe.category && (
          <p className="text-sm text-gray-500">{recipe.category}</p>
        )}
      </div>
      
      <div className="text-right">
        {recipe.costPerServing && (
          <p className="text-sm font-medium text-gray-900">
            £{recipe.costPerServing.toFixed(2)}
          </p>
        )}
        {recipe.totalCost && (
          <p className="text-xs text-gray-500">
            Total: £{recipe.totalCost.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <VirtualizedList
      items={recipes}
      height={height}
      itemHeight={88} // Height of each recipe item
      renderItem={renderRecipe}
      className="border border-gray-200 rounded-xl"
    />
  );
}

interface IngredientListItem {
  id: number;
  name: string;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  supplier?: string;
}

export function VirtualizedIngredientList({
  ingredients,
  height = 400,
  onIngredientClick,
}: {
  ingredients: IngredientListItem[];
  height?: number;
  onIngredientClick?: (ingredient: IngredientListItem) => void;
}) {
  const renderIngredient = (ingredient: IngredientListItem, index: number) => (
    <div
      key={ingredient.id}
      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onIngredientClick?.(ingredient)}
    >
      <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
        <span className="text-emerald-600 font-medium text-sm">
          {ingredient.name.charAt(0).toUpperCase()}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{ingredient.name}</h3>
        {ingredient.supplier && (
          <p className="text-sm text-gray-500">{ingredient.supplier}</p>
        )}
      </div>
      
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">
          £{ingredient.packPrice.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          {ingredient.packQuantity} {ingredient.packUnit}
        </p>
      </div>
    </div>
  );

  return (
    <VirtualizedList
      items={ingredients}
      height={height}
      itemHeight={80} // Height of each ingredient item
      renderItem={renderIngredient}
      className="border border-gray-200 rounded-xl"
    />
  );
}