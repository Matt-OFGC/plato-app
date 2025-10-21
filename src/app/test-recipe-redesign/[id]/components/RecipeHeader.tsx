"use client";

interface RecipeHeaderProps {
  title: string;
  category?: string;
  servings: number;
  viewMode: "whole" | "steps" | "edit";
  onViewModeChange: (mode: "whole" | "steps" | "edit") => void;
  onCategoryChange?: (category: string) => void;
}

const CATEGORIES = [
  "Uncategorized",
  "Cakes",
  "Bread",
  "Pastries",
  "Cookies",
  "Desserts",
  "Savory",
  "Breakfast",
  "Custom"
];

export default function RecipeHeader({
  title,
  category,
  servings,
  viewMode,
  onViewModeChange,
  onCategoryChange,
}: RecipeHeaderProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-4 sm:px-5 py-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
        {/* Title and Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 truncate">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs">
            {viewMode === "edit" && onCategoryChange ? (
              <select
                value={category || "Uncategorized"}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="px-2 py-0.5 rounded border border-gray-300 text-gray-700 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-gray-500">{category || "Uncategorized"}</span>
            )}
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{servings} slices</span>
          </div>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
          {/* View Toggle */}
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => onViewModeChange("whole")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "whole"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Whole
            </button>

            <button
              onClick={() => onViewModeChange("steps")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "steps"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Steps
            </button>
          </div>

          <button
            onClick={() => onViewModeChange(viewMode === "edit" ? "steps" : "edit")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "edit"
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {viewMode === "edit" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </>
            )}
          </button>

          <a
            href={`/test-recipe-redesign/print/${title.toLowerCase().replace(/\s+/g, "-")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </a>
        </div>
      </div>
    </div>
  );
}
