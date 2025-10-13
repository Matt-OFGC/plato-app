"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFilters {
  query: string;
  category: string;
  minCost: string;
  maxCost: string;
  allergens: string[];
  hasImage: boolean;
  sortBy: "name" | "cost" | "updated" | "foodCost";
  sortOrder: "asc" | "desc";
}

interface AdvancedSearchProps {
  categories: Array<{ id: number; name: string }>;
  onSearch: (filters: SearchFilters) => void;
}

const COMMON_ALLERGENS = [
  "Gluten", "Dairy", "Eggs", "Nuts", "Peanuts", "Soy", "Fish", "Shellfish"
];

export function AdvancedSearch({ categories, onSearch }: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    category: "",
    minCost: "",
    maxCost: "",
    allergens: [],
    hasImage: false,
    sortBy: "name",
    sortOrder: "asc",
  });

  function handleSearch() {
    onSearch(filters);
  }

  function resetFilters() {
    const defaultFilters: SearchFilters = {
      query: "",
      category: "",
      minCost: "",
      maxCost: "",
      allergens: [],
      hasImage: false,
      sortBy: "name",
      sortOrder: "asc",
    };
    setFilters(defaultFilters);
    onSearch(defaultFilters);
  }

  const activeFilterCount = [
    filters.category,
    filters.minCost,
    filters.maxCost,
    filters.allergens.length > 0,
    filters.hasImage,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar with Filter Toggle */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search recipes..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${
            showFilters ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Cost Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Cost (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.minCost}
                    onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Cost (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={filters.maxCost}
                    onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                    placeholder="100.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="name">Name</option>
                    <option value="cost">Cost</option>
                    <option value="updated">Recently Updated</option>
                    <option value="foodCost">Food Cost %</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                {/* Has Image Filter */}
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.hasImage}
                      onChange={(e) => setFilters({ ...filters, hasImage: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Has image only</span>
                  </label>
                </div>
              </div>

              {/* Allergen Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Allergens
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ALLERGENS.map(allergen => (
                    <button
                      key={allergen}
                      onClick={() => {
                        const newAllergens = filters.allergens.includes(allergen)
                          ? filters.allergens.filter(a => a !== allergen)
                          : [...filters.allergens, allergen];
                        setFilters({ ...filters, allergens: newAllergens });
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        filters.allergens.includes(allergen)
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {allergen}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Reset all filters
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

