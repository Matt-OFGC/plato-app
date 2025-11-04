"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CategorySelector } from "@/components/CategorySelector";
import Link from "next/link";

interface RecipeHeaderProps {
  title: string;
  category?: string;
  categoryId?: number | null;
  servings: number;
  viewMode: "whole" | "steps" | "edit" | "photos";
  onViewModeChange: (mode: "whole" | "steps" | "edit" | "photos") => void;
  onCategoryChange?: (categoryId: number | null) => void;
  categories?: { id: number; name: string; description?: string | null; color?: string | null }[];
  imageUrl?: string;
  onTitleChange?: (title: string) => void;
  onDelete?: () => void;
  recipeId?: number | null;
}

export default function RecipeHeader({
  title,
  category,
  categoryId,
  servings,
  viewMode,
  onViewModeChange,
  onCategoryChange,
  categories = [],
  imageUrl,
  onTitleChange,
  onDelete,
  recipeId,
}: RecipeHeaderProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg p-6">
        <div className="flex items-center gap-3">
          {/* Recipe Image - Small thumbnail */}
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group relative flex items-center justify-center"
            title={imageUrl ? "Click to view larger" : "Add recipe image"}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </button>

          {/* Title and Info */}
          <div className="flex-1 min-w-0">
            {onTitleChange && viewMode === "edit" ? (
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Recipe name"
                className="text-3xl font-bold text-gray-900 mb-1 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1 -mx-2 -my-1"
                autoFocus
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900 mb-1 truncate">
                {title}
              </h1>
            )}
            <div className="flex items-center gap-2 text-sm mt-1">
              {viewMode === "edit" && onCategoryChange ? (
                <div className="flex items-center gap-2">
                  <div className="w-64 min-w-[256px]">
                    <CategorySelector
                      categories={categories}
                      value={categoryId || null}
                      onChange={onCategoryChange}
                      placeholder="Select category..."
                      allowCreate={true}
                      onCreateCategory={async (name) => {
                        // CategorySelector handles creation via API
                      }}
                    />
                  </div>
                  <Link
                    href="/dashboard/account/content"
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                    title="Manage categories"
                  >
                    Manage
                  </Link>
                </div>
              ) : (
                <span className="text-gray-500">{category || "Uncategorized"}</span>
              )}
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{servings} slices</span>
            </div>
          </div>

        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden">
              <Image
                src={imageUrl || "/images/placeholder-cake.png"}
                alt={title}
                fill
                className="object-contain"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
