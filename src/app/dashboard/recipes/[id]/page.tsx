import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  
  if (isNaN(id)) {
    return <div className="p-6">Invalid recipe ID: {idParam}</div>;
  }

  const { companyId } = await getCurrentUserAndCompany();
  
  // Get the recipe with basic info
  const recipe = await prisma.recipe.findUnique({ 
    where: { id }, 
    include: { 
      items: {
        include: {
          ingredient: true
        }
      }
    } 
  });
  
  if (!recipe) {
    return <div className="p-6">Recipe not found for ID: {id}</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600 mt-2">Quick and easy recipe costing - works for sandwiches to cakes!</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            ← Back
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipe: {recipe.name}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
            <input
              type="text"
              defaultValue={recipe.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              defaultValue={recipe.description || ""}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
            <textarea
              defaultValue={recipe.method || ""}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yield Quantity</label>
              <input
                type="number"
                defaultValue={recipe.yieldQuantity.toString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Yield Unit</label>
              <select
                defaultValue={recipe.yieldUnit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="g">Grams</option>
                <option value="ml">Milliliters</option>
                <option value="each">Each</option>
                <option value="slices">Slices</option>
              </select>
            </div>
          </div>
          
          {recipe.portionsPerBatch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portions per Batch</label>
              <input
                type="number"
                defaultValue={recipe.portionsPerBatch.toString()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients ({recipe.items.length})</h3>
          <div className="space-y-2">
            {recipe.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{item.quantity} {item.unit}</span>
                <span className="text-gray-700">{item.ingredient.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            Save Changes
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}