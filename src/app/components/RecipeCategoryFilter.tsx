"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

interface RecipeCategoryFilterProps {
  categories: string[];
  selectedCategory?: string;
}

export function RecipeCategoryFilter({ categories, selectedCategory }: RecipeCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toAppRoute } = useAppAwareRoute();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync search term with URL params
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchTerm(currentSearch);
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
        setCategorySearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    setIsCategoryDropdownOpen(false);
    setCategorySearchTerm("");
    router.push(`${toAppRoute("/dashboard/recipes")}?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const params = new URLSearchParams(searchParams);
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    
    router.push(`${toAppRoute("/dashboard/recipes")}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchChange(searchTerm);
  };

  // Filter categories based on search term
  const filteredCategories = (categories || []).filter(category =>
    category && category.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg md:rounded-xl border border-gray-200 p-2.5 md:p-3 lg:p-4 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-4 w-full">
        {/* Left side: Category filter dropdown */}
        <div className="flex-shrink-0" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-xs md:text-sm font-medium text-gray-700 min-w-[160px] md:min-w-[200px] justify-between mobile-touch-target"
            >
              <span className="truncate">
                {selectedCategory || "All Categories"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                  isCategoryDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[300px] flex flex-col">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Category list */}
                <div className="overflow-y-auto max-h-[240px]">
                  {/* All Categories option */}
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm transition-colors hover:bg-emerald-50 flex items-center gap-2 ${
                      !selectedCategory
                        ? "bg-emerald-100 text-emerald-800 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${
                        !selectedCategory ? "text-emerald-600" : "text-transparent"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>All Categories</span>
                    <span className="ml-auto text-gray-400 text-xs">
                      ({(categories || []).length})
                    </span>
                  </button>

                  {/* Category options */}
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`w-full text-left px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm transition-colors hover:bg-emerald-50 flex items-center gap-2 ${
                          selectedCategory === category
                            ? "bg-emerald-100 text-emerald-800 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 flex-shrink-0 ${
                            selectedCategory === category ? "text-emerald-600" : "text-transparent"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="truncate">{category}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-500 text-center">
                      No categories found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search recipes..."
              className="w-full px-3 md:px-4 py-2 md:py-2.5 pl-9 md:pl-10 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
