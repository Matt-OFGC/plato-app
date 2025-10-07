"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface RecipeCategoryFilterProps {
  categories: string[];
  selectedCategory?: string;
}

export function RecipeCategoryFilter({ categories, selectedCategory }: RecipeCategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    
    router.push(`/recipes?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <h3 className="text-sm font-semibold text-gray-900">Filter by Category:</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
    </div>
  );
}
