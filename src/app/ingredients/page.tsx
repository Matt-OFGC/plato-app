import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteIngredient } from "./actions";
import { formatCurrency } from "@/lib/currency";
import { getCurrentUserAndCompany } from "@/lib/current";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  const ingredients = await prisma.ingredient.findMany({ where, orderBy: { name: "asc" } });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ingredients</h1>
          <p className="text-gray-600 mt-2">Manage your ingredient inventory and pricing data</p>
        </div>
        <Link href="/ingredients/new" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ingredient
        </Link>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No ingredients yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first ingredient</p>
          <Link href="/ingredients/new" className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
            Add First Ingredient
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Supplier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pack Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Density</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/ingredients/${ing.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {ing.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{ing.supplier ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {String(ing.packQuantity)} {ing.packUnit}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(Number(ing.packPrice), ing.currency)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {ing.densityGPerMl ? `${String(ing.densityGPerMl)} g/ml` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => { 'use server'; await deleteIngredient(ing.id); }}>
                        <button 
                          type="submit" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


