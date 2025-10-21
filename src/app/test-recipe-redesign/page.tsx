import Link from "next/link";

export default function TestRecipeRedesignPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Recipe Page Redesign
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            A complete rebuild with modern UI and enhanced features
          </p>
          <p className="text-sm text-gray-500">
            Built from scratch based on the design mockup
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/test-recipe-redesign/old-skool-sponge"
            className="block w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl px-8 py-4 text-center text-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            View Recipe: Old Skool Sponge
          </Link>

          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <h2 className="font-bold text-gray-900 mb-3">Features Included:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Three view modes: Whole, Steps, and Edit
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Dynamic recipe scaling with servings adjustment
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Ingredient checklist with persistent state
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Interactive timers for cooking steps
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Drag-and-drop ingredient reordering (Edit mode)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Real-time cost calculations
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Step-by-step navigation
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span> Print-friendly layout
              </li>
            </ul>
          </div>

          <Link
            href="/dashboard/recipes"
            className="block w-full text-center text-gray-600 hover:text-gray-900 py-3 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

