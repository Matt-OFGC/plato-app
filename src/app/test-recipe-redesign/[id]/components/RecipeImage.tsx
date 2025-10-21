"use client";

import Image from "next/image";
import { useState } from "react";

interface RecipeImageProps {
  imageUrl?: string;
  title: string;
  isEditMode?: boolean;
}

export default function RecipeImage({ imageUrl, title, isEditMode = false }: RecipeImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleImageClick = () => {
    if (isEditMode) {
      // In a real app, this would trigger a file upload dialog
      alert("Image upload functionality would go here!\n\nIn production, this would:\n• Open file picker\n• Upload to server\n• Update recipe image");
    }
  };

  const maxWidth = isEditMode ? "max-w-[140px]" : "max-w-[200px]";
  const size = isEditMode ? 140 : 200;

  return (
    <div 
      className={`rounded-2xl bg-pink-100 aspect-square overflow-hidden border border-pink-200 shadow-sm ${maxWidth} relative transition-all ${
        isEditMode ? "cursor-pointer" : ""
      }`}
      onClick={handleImageClick}
      onMouseEnter={() => isEditMode && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={imageUrl || "/images/placeholder-cake.png"}
        alt={title}
        width={size}
        height={size}
        className="w-full h-full object-cover"
      />
      
      {/* Upload overlay in edit mode */}
      {isEditMode && (
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          <div className="text-center text-white">
            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs font-medium">Change Photo</p>
          </div>
        </div>
      )}
    </div>
  );
}

