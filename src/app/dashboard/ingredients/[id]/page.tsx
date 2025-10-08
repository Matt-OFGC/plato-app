import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateIngredient } from "../actions";
import { fromBase, Unit } from "@/lib/units";
import { SupplierSelector } from "@/components/SupplierSelector";

interface Props { params: Promise<{ id: string }> }

export default async function EditIngredientPage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const ing = await prisma.ingredient.findUnique({ 
    where: { id },
    include: { supplierRef: true }
  });
  if (!ing) return <div className="p-6">Not found</div>;

  // Get suppliers for the dropdown
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" }
  });

  // Calculate the original quantity to display
  const originalUnit = ing.originalUnit || ing.packUnit;
  const originalQuantity = ing.originalUnit 
    ? fromBase(Number(ing.packQuantity), originalUnit as Unit, ing.densityGPerMl ? Number(ing.densityGPerMl) : undefined)
    : Number(ing.packQuantity);

  async function action(formData: FormData) {
    "use server";
    await updateIngredient(id, formData);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Ingredient</h1>
        <p className="text-gray-600 mt-2">Update ingredient details and pricing</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <form action={action} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Ingredient Name</label>
            <input 
              name="name" 
              defaultValue={ing.name} 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Supplier</label>
            <SupplierSelector
              suppliers={suppliers}
              value={ing.supplierId}
              onChange={(supplierId) => {
                // This will be handled by the form submission
                const hiddenInput = document.querySelector('input[name="supplierId"]') as HTMLInputElement;
                if (hiddenInput) {
                  hiddenInput.value = supplierId?.toString() || '';
                }
              }}
              placeholder="Select or create supplier..."
            />
            <input type="hidden" name="supplierId" value={ing.supplierId?.toString() || ""} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Quantity</label>
              <input 
                type="number" 
                step="any" 
                name="packQuantity" 
                defaultValue={originalQuantity} 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Unit</label>
              <select 
                name="packUnit" 
                defaultValue={ing.originalUnit || ing.packUnit} 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors"
              >
                <optgroup label="Weight/Mass">
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="mg">Milligrams (mg)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="oz">Ounces (oz)</option>
                </optgroup>
                <optgroup label="Volume">
                  <option value="ml">Milliliters (ml)</option>
                  <option value="l">Liters (l)</option>
                  <option value="tsp">Teaspoons (tsp)</option>
                  <option value="tbsp">Tablespoons (tbsp)</option>
                  <option value="cup">Cups</option>
                  <option value="floz">Fluid Ounces (fl oz)</option>
                  <option value="pint">Pints</option>
                  <option value="quart">Quarts</option>
                  <option value="gallon">Gallons</option>
                </optgroup>
                <optgroup label="Count/Discrete">
                  <option value="each">Each</option>
                  <option value="slices">Slices</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Pack Price (GBP)</label>
              <input 
                type="number" 
                step="any" 
                name="packPrice" 
                defaultValue={Number(ing.packPrice)} 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
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
              defaultValue={ing.densityGPerMl == null ? "" : String(ing.densityGPerMl)} 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label>
            <textarea 
              name="notes" 
              defaultValue={ing.notes ?? ""} 
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-colors" 
              rows={3}
              placeholder="Any additional notes about this ingredient..."
            />
          </div>
          
          <div className="flex items-center gap-4 pt-4">
            <button 
              type="submit" 
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </button>
            <Link 
              href="/dashboard/ingredients" 
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


