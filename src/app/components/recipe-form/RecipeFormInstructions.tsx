"use client";

interface RecipeFormInstructionsProps {
  method: string;
  useSections: boolean;
  onMethodChange: (value: string) => void;
}

export function RecipeFormInstructions({
  method,
  useSections,
  onMethodChange,
}: RecipeFormInstructionsProps) {
  if (useSections) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
        <div className="text-sm text-gray-500 italic text-center py-6 bg-emerald-50 rounded-lg">
          Instructions are managed within each section above
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
      <textarea
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        rows={8}
        placeholder="Write your cooking instructions here..."
        className="w-full border-2 border-emerald-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

