'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { List } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; item: T }) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  onScroll,
  overscan = 5,
}: VirtualListProps<T>) {
  const listRef = useRef<List>(null);

  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    onScroll?.(scrollTop);
  }, [onScroll]);

  return (
    <div className={`virtual-list ${className}`}>
      <List
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        onScroll={handleScroll}
        overscanCount={overscan}
        itemData={items}
      >
        {({ index, style, data }) => renderItem({ index, style, item: data[index] })}
      </List>
    </div>
  );
}

// Optimized search component with debouncing
interface FastSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function FastSearch({ 
  onSearch, 
  placeholder = 'Search...', 
  debounceMs = 300,
  className = '' 
}: FastSearchProps) {
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback((searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onSearch(searchQuery);
    }, debounceMs);
  }, [onSearch, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder={placeholder}
      className={`fast-search-input ${className}`}
      autoComplete="off"
    />
  );
}

// High-performance filter component
interface FastFilterProps<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  searchPlaceholder?: string;
  className?: string;
  itemHeight?: number;
  maxHeight?: number;
}

export function FastFilter<T>({
  items,
  filterFn,
  renderItem,
  searchPlaceholder = 'Filter items...',
  className = '',
  itemHeight = 60,
  maxHeight = 400,
}: FastFilterProps<T>) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  // Memoize filtered results
  const memoizedFilteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter(item => filterFn(item, query));
  }, [items, query, filterFn]);

  useEffect(() => {
    setFilteredItems(memoizedFilteredItems);
  }, [memoizedFilteredItems]);

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  return (
    <div className={`fast-filter ${className}`}>
      <FastSearch
        onSearch={handleSearch}
        placeholder={searchPlaceholder}
        className="mb-4"
      />
      
      <VirtualList
        items={filteredItems}
        height={Math.min(maxHeight, filteredItems.length * itemHeight)}
        itemHeight={itemHeight}
        renderItem={({ index, style, item }) => (
          <div style={style}>
            {renderItem(item, index)}
          </div>
        )}
      />
    </div>
  );
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
  };
}
