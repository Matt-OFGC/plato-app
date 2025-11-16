"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface RecipeCategoryFilterProps {
  categories: string[];
  selectedCategory?: string;
}

export function RecipeCategoryFilter({ categories, selectedCategory }: RecipeCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

  // Sync search term with URL params
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchTerm(currentSearch);
  }, [searchParams]);

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    router.push(`/dashboard/recipes?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    
    router.push(`/dashboard/recipes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchChange(searchTerm);
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-3 lg:p-4 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-4 w-full">
        {/* Left side: Category filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 flex-1">
          <h3 className="text-xs md:text-sm font-semibold text-gray-900 whitespace-nowrap">Filter by Category:</h3>
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors mobile-touch-target ${
                !selectedCategory
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors mobile-touch-target ${
                  selectedCategory === category
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search recipes..."
              className="w-full sm:w-64 md:w-72 lg:w-80 px-3 md:px-4 py-2 md:py-2.5 pl-9 md:pl-10 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <svg 
              className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
