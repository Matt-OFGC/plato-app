import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteRecipe } from "./actions";
import { getCurrentUserAndCompany } from "@/lib/current";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  const recipes = await prisma.recipe.findMany({ where, orderBy: { name: "asc" }, include: { items: true } });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-600 mt-2">Create and manage your recipes with automatic cost calculation</p>
        </div>
        <Link href="/recipes/new" className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes yet</h3>
          <p className="text-gray-600 mb-6">Create your first recipe to get started</p>
          <Link href="/recipes/new" className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors font-medium">
            Create First Recipe
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Yield</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ingredients</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recipes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/recipes/${r.id}`} className="text-purple-600 hover:text-purple-700 font-medium">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {String(r.yieldQuantity)} {r.yieldUnit}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                        {r.items.length} ingredient{r.items.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => { 'use server'; await deleteRecipe(r.id); }}>
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


