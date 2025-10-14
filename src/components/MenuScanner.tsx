"use client";

import { useState, useRef } from "react";

interface ExtractedRecipe {
  name: string;
  description: string;
  price: number | null;
  currency: string;
  category: string;
  estimatedIngredients: string[];
  confidence: number;
}

interface MenuScannerProps {
  onRecipesExtracted: (recipes: any[]) => void;
  onClose: () => void;
}

export function MenuScanner({ onRecipesExtracted, onClose }: MenuScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedRecipes, setExtractedRecipes] = useState<ExtractedRecipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/ai/scan-menu", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan menu");
      }

      setExtractedRecipes(data.recipes || []);
      // Auto-select all recipes with high confidence
      const highConfidenceIndices = data.recipes
        ?.map((_: any, index: number) => index)
        .filter((index: number) => data.recipes[index].confidence > 0.8) || [];
      setSelectedRecipes(new Set(highConfidenceIndices));

    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        setError("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to scan menu");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleRecipe = (index: number) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecipes(newSelected);
  };

  const handleImportSelected = () => {
    const recipesToImport = Array.from(selectedRecipes).map(index => ({
      name: extractedRecipes[index].name,
      description: extractedRecipes[index].description,
      yieldQuantity: 1,
      yieldUnit: "each" as const,
      category: extractedRecipes[index].category,
      sellingPrice: extractedRecipes[index].price,
      estimatedIngredients: extractedRecipes[index].estimatedIngredients,
    }));

    onRecipesExtracted(recipesToImport);
    onClose();
  };

  const selectAll = () => {
    setSelectedRecipes(new Set(extractedRecipes.map((_, index) => index)));
  };

  const selectNone = () => {
    setSelectedRecipes(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scan Menu</h2>
              <p className="text-gray-600 mt-1">Upload a menu photo to extract recipes</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!extractedRecipes.length ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Menu Photo</h3>
                <p className="text-gray-600 mb-6">
                  Upload a photo of your menu to automatically extract recipes and create recipe items
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isScanning}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScanning ? "Scanning..." : "Choose Menu Photo"}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Supports JPEG, PNG, and WebP images
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {isScanning && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-3">
                    <svg className="w-6 h-6 animate-spin text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-gray-600">Analyzing menu...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Extracted Recipes ({extractedRecipes.length})
                  </h3>
                  <p className="text-sm text-gray-600">Review and select recipes to import</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={selectNone}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Select None
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {extractedRecipes.map((recipe, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedRecipes.has(index)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleRecipe(index)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedRecipes.has(index)}
                          onChange={() => toggleRecipe(index)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{recipe.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        {recipe.price && (
                          <span className="font-semibold text-green-700">
                            {recipe.currency} {recipe.price.toFixed(2)}
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {recipe.category}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        recipe.confidence > 0.8 
                          ? "bg-green-100 text-green-800" 
                          : recipe.confidence > 0.6
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {Math.round(recipe.confidence * 100)}%
                      </span>
                    </div>

                    {recipe.estimatedIngredients.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Estimated ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.estimatedIngredients.slice(0, 4).map((ingredient, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {ingredient}
                            </span>
                          ))}
                          {recipe.estimatedIngredients.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{recipe.estimatedIngredients.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Upload Another Menu
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedRecipes.size === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Import Selected ({selectedRecipes.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
