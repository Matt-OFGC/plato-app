"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchFilter {
  category?: string;
  minCost?: number;
  maxCost?: number;
  minDate?: string;
  maxDate?: string;
  tags?: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: string;
}

interface AdvancedSearchProps {
  placeholder?: string;
  className?: string;
  onFiltersChange?: (filters: SearchFilter) => void;
  showAdvancedFilters?: boolean;
  entityType?: "recipes" | "ingredients";
}

export function AdvancedSearch({
  placeholder = "Search...",
  className = "",
  onFiltersChange,
  showAdvancedFilters = false,
  entityType = "recipes",
}: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(showAdvancedFilters);
  const [filters, setFilters] = useState<SearchFilter>({
    category: searchParams.get("category") || undefined,
    minCost: searchParams.get("minCost") ? Number(searchParams.get("minCost")) : undefined,
    maxCost: searchParams.get("maxCost") ? Number(searchParams.get("maxCost")) : undefined,
  });
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load search history and saved searches from localStorage
  useEffect(() => {
    try {
      const history = localStorage.getItem(`search-history-${entityType}`);
      if (history) {
        setSearchHistory(JSON.parse(history).slice(0, 10)); // Keep last 10 searches
      }

      const saved = localStorage.getItem(`saved-searches-${entityType}`);
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load search history:", error);
    }
  }, [entityType]);

  // Update URL params when search or filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
        // Save to history
        if (searchTerm.trim().length > 2) {
          setSearchHistory((prev) => {
            const updated = [searchTerm.trim(), ...prev.filter((s) => s !== searchTerm.trim())].slice(0, 10);
            try {
              localStorage.setItem(`search-history-${entityType}`, JSON.stringify(updated));
            } catch (error) {
              console.error("Failed to save search history:", error);
            }
            return updated;
          });
        }
      } else {
        params.delete("search");
      }

      if (filters.category) {
        params.set("category", filters.category);
      } else {
        params.delete("category");
      }

      if (filters.minCost !== undefined) {
        params.set("minCost", filters.minCost.toString());
      } else {
        params.delete("minCost");
      }

      if (filters.maxCost !== undefined) {
        params.set("maxCost", filters.maxCost.toString());
      } else {
        params.delete("maxCost");
      }

      if (onFiltersChange) {
        onFiltersChange(filters);
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.push(newUrl);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timer);
  }, [searchTerm, filters, router, searchParams, onFiltersChange, entityType]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
        setShowSavedSearches(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveSearch = () => {
    if (!searchTerm.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchTerm.trim(),
      query: searchTerm.trim(),
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSavedSearch, ...savedSearches].slice(0, 20); // Keep max 20 saved searches
    setSavedSearches(updated);
    try {
      localStorage.setItem(`saved-searches-${entityType}`, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save search:", error);
    }
    setShowSavedSearches(false);
  };

  const handleLoadSavedSearch = (saved: SavedSearch) => {
    setSearchTerm(saved.query);
    setFilters(saved.filters);
    setShowSavedSearches(false);
  };

  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    try {
      localStorage.setItem(`saved-searches-${entityType}`, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete saved search:", error);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowHistory(e.target.value.length === 0);
          }}
          onFocus={() => {
            if (searchTerm.length === 0) {
              setShowHistory(true);
            }
          }}
          className="block w-full pl-10 pr-24 py-2 border border-gray-300 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear filters"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-emerald-100 text-emerald-600"
                : "hover:bg-gray-100 text-gray-400"
            }`}
            title="Advanced filters"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Clear search"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
            Recent Searches
          </div>
          {searchHistory.map((term, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSearchTerm(term);
                setShowHistory(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="absolute z-40 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
              <div className="flex items-center gap-2">
                {savedSearches.length > 0 && (
                  <button
                    onClick={() => setShowSavedSearches(!showSavedSearches)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Saved ({savedSearches.length})
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={handleSaveSearch}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Save Search
                  </button>
                )}
              </div>
            </div>

            {entityType === "recipes" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Cost
                  </label>
                  <input
                    type="number"
                    value={filters.minCost || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, minCost: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Cost
                  </label>
                  <input
                    type="number"
                    value={filters.maxCost || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, maxCost: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="1000.00"
                    step="0.01"
                  />
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value === undefined || value === "") return null;
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full"
                    >
                      {key}: {value}
                      <button
                        onClick={() => setFilters({ ...filters, [key]: undefined })}
                        className="hover:text-emerald-600"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Searches Dropdown */}
      {showSavedSearches && savedSearches.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
            Saved Searches
          </div>
          {savedSearches.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors group"
            >
              <button
                onClick={() => handleLoadSavedSearch(saved)}
                className="flex-1 text-left text-sm text-gray-700"
              >
                {saved.name}
              </button>
              <button
                onClick={() => handleDeleteSavedSearch(saved.id)}
                className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity"
                title="Delete saved search"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

