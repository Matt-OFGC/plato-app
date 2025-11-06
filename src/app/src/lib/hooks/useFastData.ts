'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Global cache for API responses
const globalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache configuration
const CACHE_TTL = {
  ingredients: 5 * 60 * 1000, // 5 minutes
  recipes: 10 * 60 * 1000, // 10 minutes
  suppliers: 30 * 60 * 1000, // 30 minutes
  categories: 60 * 60 * 1000, // 1 hour
  static: 24 * 60 * 60 * 1000, // 24 hours
};

interface UseFastDataOptions {
  cacheKey: string;
  ttl?: number;
  prefetch?: boolean;
  backgroundRefresh?: boolean;
}

export function useFastData<T>(
  fetchFn: () => Promise<T>,
  options: UseFastDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  const { cacheKey, ttl = CACHE_TTL.static, prefetch = false, backgroundRefresh = true } = options;

  // Check cache first
  const getCachedData = useCallback(() => {
    const cached = globalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }, [cacheKey]);

  // Set cache
  const setCachedData = useCallback((newData: T) => {
    globalCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now(),
      ttl,
    });
  }, [cacheKey, ttl]);

  // Fetch data with error handling
  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const result = await fetchFn();
      
      if (!isBackground) {
        setData(result);
        setError(null);
      }
      
      setCachedData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      if (!isBackground) {
        setError(error);
      }
      throw error;
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [fetchFn, setCachedData]);

  // Initial load
  useEffect(() => {
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      
      // Background refresh if data is getting stale
      if (backgroundRefresh) {
        const cached = globalCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp > cached.ttl * 0.8) {
          fetchData(true);
        }
      }
    } else {
      fetchData();
    }
  }, [cacheKey, getCachedData, fetchData, backgroundRefresh]);

  // Prefetch related data
  useEffect(() => {
    if (prefetch && data) {
      // Implement prefetching logic based on data type
      if (typeof data === 'object' && data !== null) {
        // Prefetch related data based on current data
        // This would be customized per component
      }
    }
  }, [prefetch, data]);

  // Manual refresh
  const refresh = useCallback(() => {
    globalCache.delete(cacheKey);
    return fetchData();
  }, [cacheKey, fetchData]);

  // Optimistic update
  const optimisticUpdate = useCallback((updater: (current: T) => T) => {
    if (data) {
      const newData = updater(data);
      setData(newData);
      setCachedData(newData);
    }
  }, [data, setCachedData]);

  return {
    data,
    loading,
    error,
    refresh,
    optimisticUpdate,
  };
}

// Specialized hooks for common data types
export function useFastIngredients(companyId: number) {
  return useFastData(
    () => fetch(`/api/ingredients?companyId=${companyId}`).then(res => res.json()),
    {
      cacheKey: `ingredients-${companyId}`,
      ttl: CACHE_TTL.ingredients,
      backgroundRefresh: true,
    }
  );
}

export function useFastRecipes(companyId: number) {
  return useFastData(
    () => fetch(`/api/recipes?companyId=${companyId}`).then(res => res.json()),
    {
      cacheKey: `recipes-${companyId}`,
      ttl: CACHE_TTL.recipes,
      backgroundRefresh: true,
    }
  );
}

export function useFastSuppliers(companyId: number) {
  return useFastData(
    () => fetch(`/api/suppliers?companyId=${companyId}`).then(res => res.json()),
    {
      cacheKey: `suppliers-${companyId}`,
      ttl: CACHE_TTL.suppliers,
      backgroundRefresh: true,
    }
  );
}

// Prefetch utility
export function prefetchData(url: string, cacheKey: string, ttl: number = CACHE_TTL.static) {
  if (globalCache.has(cacheKey)) return;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      globalCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    })
    .catch(console.error);
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of globalCache.keys()) {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    }
  } else {
    globalCache.clear();
  }
}
