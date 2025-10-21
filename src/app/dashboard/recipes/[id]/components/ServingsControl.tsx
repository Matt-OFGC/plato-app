"use client";

interface ServingsControlProps {
  servings: number;
  onServingsChange: (servings: number) => void;
  recipeType?: "single" | "batch";
  baseServings?: number;
}

export default function ServingsControl({
  servings,
  onServingsChange,
  recipeType = "batch",
  baseServings = 15,
}: ServingsControlProps) {
  const handleDecrease = () => {
    onServingsChange(Math.max(1, servings - 1));
  };

  const handleIncrease = () => {
    onServingsChange(servings + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onServingsChange(value);
    }
  };

  // Calculate batch multiplier when in batch mode
  const batchMultiplier = recipeType === "batch" ? servings / baseServings : 1;
  const batchText = recipeType === "batch" 
    ? `${batchMultiplier.toFixed(1)}x batch${batchMultiplier !== 1 ? 'es' : ''}`
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Servings
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {recipeType === "batch" 
            ? `Adjust batch quantity • ${batchText}`
            : "Adjust recipe quantity"}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleDecrease}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center text-gray-700 font-medium"
          aria-label="Decrease servings"
        >
          −
        </button>
        
        <input
          type="number"
          value={servings}
          onChange={handleInputChange}
          className="w-16 text-center text-2xl font-bold text-gray-900 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg py-1"
          min="1"
        />
        
        <button
          onClick={handleIncrease}
          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center text-gray-700 font-medium"
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  );
}

