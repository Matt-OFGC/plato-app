"use client";

interface RecipeMetadataProps {
  allergens?: string[];
  storage?: string;
  shelfLife?: string;
  viewMode?: "whole" | "steps" | "edit";
  storageOptions?: { id: number; name: string }[];
  shelfLifeOptions?: { id: number; name: string }[];
  onStorageChange?: (storage: string) => void;
  onShelfLifeChange?: (shelfLife: string) => void;
}

export default function RecipeMetadata({
  allergens,
  storage,
  shelfLife,
  viewMode = "whole",
  storageOptions = [],
  shelfLifeOptions = [],
  onStorageChange,
  onShelfLifeChange,
}: RecipeMetadataProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Recipe Information
        </p>
      </div>

      {/* Metadata */}
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Allergens
          </p>
          {allergens && allergens.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200"
                >
                  {allergen}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">None</p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Storage
          </p>
          {viewMode === "edit" && storageOptions.length > 0 ? (
            <select
              value={storage || ""}
              onChange={(e) => onStorageChange?.(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Not specified</option>
              {storageOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-700">
              {storage || "Not specified"}
            </p>
          )}
        </div>

        <div className="h-px bg-gray-100" />

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            Shelf Life
          </p>
          {viewMode === "edit" && shelfLifeOptions.length > 0 ? (
            <select
              value={shelfLife || ""}
              onChange={(e) => onShelfLifeChange?.(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Not specified</option>
              {shelfLifeOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-700">
              {shelfLife || "Not specified"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

