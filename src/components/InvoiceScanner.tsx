"use client";

import { useState, useRef } from "react";
import { SearchableSelect } from "./SearchableSelect";

interface ExtractedIngredient {
  name: string;
  packQuantity: number;
  packUnit: string;
  packPrice: number;
  currency: string;
  confidence: number;
}

interface InvoiceScannerProps {
  onIngredientsExtracted: (ingredients: any[]) => void;
  onClose: () => void;
}

export function InvoiceScanner({ onIngredientsExtracted, onClose }: InvoiceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<ExtractedIngredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
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

      const response = await fetch("/api/ai/scan-invoice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan invoice");
      }

      setExtractedIngredients(data.ingredients || []);
      // Auto-select all ingredients with high confidence
      const highConfidenceIndices = data.ingredients
        ?.map((_: any, index: number) => index)
        .filter((index: number) => data.ingredients[index].confidence > 0.8) || [];
      setSelectedIngredients(new Set(highConfidenceIndices));

    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        setError("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to scan invoice");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleIngredient = (index: number) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIngredients(newSelected);
  };

  const handleImportSelected = () => {
    const ingredientsToImport = Array.from(selectedIngredients).map(index => ({
      ...extractedIngredients[index],
      // Convert to format expected by ingredient creation
      name: extractedIngredients[index].name,
      packQuantity: extractedIngredients[index].packQuantity,
      packUnit: extractedIngredients[index].packUnit,
      packPrice: extractedIngredients[index].packPrice,
      currency: extractedIngredients[index].currency,
    }));

    onIngredientsExtracted(ingredientsToImport);
    onClose();
  };

  const selectAll = () => {
    setSelectedIngredients(new Set(extractedIngredients.map((_, index) => index)));
  };

  const selectNone = () => {
    setSelectedIngredients(new Set());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Scan Invoice</h2>
              <p className="text-gray-600 mt-1">Upload an invoice or receipt to extract ingredients</p>
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
          {!extractedIngredients.length ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Invoice or Receipt</h3>
                <p className="text-gray-600 mb-6">
                  Upload a photo of your invoice/receipt to automatically extract ingredients
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isScanning}
              />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isScanning ? "Scanning..." : "Choose File"}
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
                    <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-gray-600">Analyzing invoice...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Extracted Ingredients ({extractedIngredients.length})
                  </h3>
                  <p className="text-sm text-gray-600">Review and select ingredients to import</p>
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

              <div className="space-y-3">
                {extractedIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedIngredients.has(index)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleIngredient(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIngredients.has(index)}
                          onChange={() => toggleIngredient(index)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{ingredient.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{ingredient.packQuantity} {ingredient.packUnit}</span>
                            <span>{ingredient.currency} {ingredient.packPrice.toFixed(2)}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              ingredient.confidence > 0.8 
                                ? "bg-green-100 text-green-800" 
                                : ingredient.confidence > 0.6
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {Math.round(ingredient.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedIngredients.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Import Selected ({selectedIngredients.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
