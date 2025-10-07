import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createRecipe } from "../actions";
import { RecipeForm } from "../RecipeForm";
import { getCurrentUserAndCompany } from "@/lib/current";

export default async function NewRecipePage() {
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  const ingredients = await prisma.ingredient.findMany({ where, orderBy: { name: "asc" } });

  async function action(formData: FormData) {
    "use server";
    await createRecipe(formData);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Recipe</h1>
          <p className="text-gray-600 mt-2">Create a new recipe with automatic cost calculation</p>
        </div>
        <Link href="/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          ← Back to Recipes
        </Link>
      </div>
      
      {companyId == null ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            No company found for your account; items will be created without company scoping.
          </div>
        </div>
      ) : null}
      
      <RecipeForm
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          packQuantity: Number(i.packQuantity),
          packUnit: i.packUnit as any,
          packPrice: Number(i.packPrice),
          densityGPerMl: i.densityGPerMl == null ? null : Number(i.densityGPerMl),
        }))}
        onSubmit={action}
      />
    </div>
  );
}


