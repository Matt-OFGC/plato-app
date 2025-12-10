"use client";

import { selectAllOnFocus } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";

interface RecipeFormHeaderProps {
  name: string;
  description: string;
  yieldQuantity: number;
  yieldUnit: string;
  totalCost: number;
  costPerUnit: number;
  imageUrl: string;
  uploading: boolean;
  uploadError: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onYieldQuantityChange: (value: number) => void;
  onYieldUnitChange: (value: string) => void;
  onImageChange: (file: File) => Promise<void>;
  onRecipeTypeChange: (type: "single" | "batch") => void;
}

export function RecipeFormHeader({
  name,
  description,
  yieldQuantity,
  yieldUnit,
  totalCost,
  costPerUnit,
  imageUrl,
  uploading,
  uploadError,
  onNameChange,
  onDescriptionChange,
  onYieldQuantityChange,
  onYieldUnitChange,
  onImageChange,
  onRecipeTypeChange,
}: RecipeFormHeaderProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }
    
    await onImageChange(file);
  };

  return (
    <div className="mb-8">
      <div className="flex gap-6 items-start">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onFocus={selectAllOnFocus}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Recipe Name (e.g., Classic Mac and Cheese)"
            className="text-4xl font-bold text-gray-900 mb-4 w-full border-2 border-emerald-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
            placeholder="Add a description..."
            className="text-lg text-gray-600 mb-4 w-full border-2 border-emerald-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-2">
              <span>Yield:</span>
              <input
                type="number"
                value={yieldQuantity}
                onFocus={selectAllOnFocus}
                onChange={(e) => onYieldQuantityChange(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={yieldUnit}
                onChange={(e) => onYieldUnitChange(e.target.value)}
                className="px-2 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="each">servings</option>
                <option value="g">grams</option>
                <option value="ml">milliliters</option>
                <option value="slices">slices</option>
              </select>
            </div>
            <span>Total Cost: {formatCurrency(totalCost)}</span>
            <span>Cost per: {formatCurrency(costPerUnit)}</span>
          </div>

          {/* Recipe Type Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Recipe Type:</span>
            <div className="relative inline-flex bg-gray-100 rounded-lg p-1 shadow-inner">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-md shadow-sm transition-all duration-300 ease-out ${
                  yieldUnit === "each" && yieldQuantity === 1 ? "left-1" : "left-[calc(50%+0.125rem)]"
                }`}
              ></div>
              
              <button
                type="button"
                onClick={() => {
                  onYieldUnitChange("each");
                  onYieldQuantityChange(1);
                  onRecipeTypeChange("single");
                }}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  yieldUnit === "each" && yieldQuantity === 1
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Single Serving
              </button>
              <button
                type="button"
                onClick={() => {
                  onYieldUnitChange("each");
                  onYieldQuantityChange(4);
                  onRecipeTypeChange("batch");
                }}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  yieldUnit === "each" && yieldQuantity > 1
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Batch Recipe
              </button>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        <div className="w-32 h-32 flex-shrink-0">
          {imageUrl ? (
            <div className="relative group w-full h-full">
              <img 
                src={imageUrl} 
                alt="Recipe preview" 
                className="w-full h-full object-cover rounded-xl shadow-md"
              />
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center group cursor-pointer border-2 border-dashed border-emerald-300 hover:border-emerald-400">
              {uploading ? (
                <>
                  <svg className="w-8 h-8 text-emerald-400 animate-spin mb-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-emerald-400 group-hover:text-emerald-500 transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-emerald-600 font-semibold">Add Image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          {uploadError && (
            <p className="text-xs text-red-600 mt-1">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}






