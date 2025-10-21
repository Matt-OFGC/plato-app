"use client";

interface RecipeTypeSelectorProps {
  recipeType: "single" | "batch";
  onRecipeTypeChange: (type: "single" | "batch") => void;
  slicesPerBatch: number;
  onSlicesPerBatchChange: (slices: number) => void;
}

export default function RecipeTypeSelector({
  recipeType,
  onRecipeTypeChange,
  slicesPerBatch,
  onSlicesPerBatchChange,
}: RecipeTypeSelectorProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="text-center mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
          Recipe Type
        </p>
      </div>

      {/* Toggle */}
      <div className="bg-gray-100 rounded-xl p-1 flex gap-1 mb-4">
        <button
          onClick={() => onRecipeTypeChange("single")}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            recipeType === "single"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Single
        </button>
        <button
          onClick={() => onRecipeTypeChange("batch")}
          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            recipeType === "batch"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Batch
        </button>
      </div>

      {/* Slices per batch (only show for batch type) */}
      {recipeType === "batch" && (
        <div>
          <p className="text-xs text-gray-500 text-center mb-2">
            Slices per batch
          </p>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => onSlicesPerBatchChange(slicesPerBatch + 1)}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors flex items-center justify-center text-white text-xl font-bold shadow-sm"
              aria-label="Increase slices"
            >
              +
            </button>

            <input
              type="number"
              value={slicesPerBatch}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  onSlicesPerBatchChange(val);
                }
              }}
              className="w-full text-center text-3xl font-bold text-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-2"
              min="1"
            />

            <button
              onClick={() => onSlicesPerBatchChange(Math.max(1, slicesPerBatch - 1))}
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors flex items-center justify-center text-white text-xl font-bold shadow-sm"
              aria-label="Decrease slices"
            >
              −
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

