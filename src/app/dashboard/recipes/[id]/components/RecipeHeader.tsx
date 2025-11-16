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
  onImageUpload?: (file: File) => void;
  isUploadingImage?: boolean;
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
  onImageUpload,
  isUploadingImage = false,
  onTitleChange,
  onDelete,
  recipeId,
}: RecipeHeaderProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Reset error state when imageUrl changes
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <>
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg py-3 md:py-4 px-3 md:px-4 lg:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Recipe Image - Small thumbnail */}
          <button
            onClick={() => {
              if (viewMode === "edit" && onImageUpload) {
                // In edit mode, trigger file upload
                fileInputRef.current?.click();
              } else {
                // In view mode, show modal
                setIsImageModalOpen(true);
              }
            }}
            disabled={isUploadingImage}
            className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all cursor-pointer group relative flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mobile-touch-target"
            title={viewMode === "edit" ? (imageUrl ? "Click to change image" : "Click to add image") : (imageUrl ? "Click to view larger" : "Add recipe image")}
          >
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={title}
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized={imageUrl.startsWith('/uploads/')}
                onError={() => {
                  console.error('Image failed to load:', imageUrl);
                  setImageError(true);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                {isUploadingImage ? (
                  <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
            )}
            {/* Upload overlay in edit mode */}
            {viewMode === "edit" && !isUploadingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <div className="text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[10px] font-medium">{imageUrl ? "Change" : "Add"}</p>
                </div>
              </div>
            )}
          </button>
          {/* Hidden file input for image upload */}
          {viewMode === "edit" && onImageUpload && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file);
                }
                // Reset input so same file can be selected again
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="hidden"
            />
          )}

          {/* Title and Info */}
          <div className="flex-1 min-w-0">
            {onTitleChange && viewMode === "edit" ? (
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Recipe name"
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-emerald-500 rounded px-2 py-1 -mx-2 -my-1 mobile-text-base"
                autoFocus
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 truncate">
                {title}
              </h1>
            )}
            <div className="flex flex-col xl:flex-row xl:items-center gap-1 xl:gap-2 text-sm mt-1">
              {viewMode === "edit" && onCategoryChange ? (
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                  <div className="w-full lg:w-64 lg:min-w-[256px]">
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
                <>
                  <span className="text-gray-500">{category || "Uncategorized"}</span>
                  <span className="hidden xl:inline text-gray-400">•</span>
                  <span className="text-gray-500">{servings} slices</span>
                </>
              )}
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
                unoptimized={imageUrl?.startsWith('/uploads/')}
                onError={(e) => {
                  console.error('Modal image failed to load:', imageUrl);
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-cake.png';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
