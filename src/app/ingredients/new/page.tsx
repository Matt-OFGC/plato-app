import Link from "next/link";
import { createIngredient } from "../actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { UnitConversionHelp } from "@/components/UnitConversionHelp";

export default async function NewIngredientPage() {
  const { companyId } = await getCurrentUserAndCompany();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Ingredient</h1>
        <p className="text-gray-600 mt-2">Add a new ingredient to your inventory</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <form action={createIngredient} className="space-y-6">
          {companyId == null ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                No company found for your account; items will be created without company scoping.
              </div>
            </div>
          ) : null}
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Ingredient Name</label>
            <input 
              name="name" 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              placeholder="e.g., Cheddar Cheese"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Supplier</label>
            <input 
              name="supplier" 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              placeholder="e.g., Bookers Wholesaler"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Quantity</label>
              <input 
                type="number" 
                step="any" 
                name="packQuantity" 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
                placeholder="5"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Unit</label>
              <select 
                name="packUnit" 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="each">Each</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Price (GBP)</label>
              <input 
                type="number" 
                step="any" 
                name="packPrice" 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
                placeholder="31.45"
                required 
              />
            </div>
          </div>
          
          <input type="hidden" name="currency" value="GBP" />
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Density (g/ml) - Optional</label>
            <p className="text-sm text-gray-600 mb-2">Used for converting between volume and weight measurements</p>
            <input 
              type="number" 
              step="any" 
              name="densityGPerMl" 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              placeholder="e.g., 0.95 for olive oil"
            />
            <div className="mt-3">
              <UnitConversionHelp />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
            <textarea 
              name="notes" 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors" 
              rows={3}
              placeholder="Any additional notes about this ingredient..."
            />
          </div>
          
          <div className="flex items-center gap-4 pt-4">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Ingredient
            </button>
            <Link 
              href="/ingredients" 
              className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


