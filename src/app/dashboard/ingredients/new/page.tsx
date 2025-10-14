import Link from "next/link";
import { createIngredient } from "../actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { IngredientForm } from "@/components/IngredientForm";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface NewIngredientPageProps {
  searchParams: {
    error?: string;
    name?: string;
  };
}

export default async function NewIngredientPage({ searchParams }: NewIngredientPageProps) {
  const { companyId } = await getCurrentUserAndCompany();
  
  // Get suppliers for the dropdown
  const suppliersRaw = await prisma.supplier.findMany({
    where: { companyId },
    orderBy: { name: "asc" }
  });

  // Serialize suppliers to convert Decimal to number for Client Components
  const suppliers = suppliersRaw.map(supplier => ({
    ...supplier,
    minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
  }));
  
  async function handleSubmit(formData: FormData) {
    "use server";
    await createIngredient(formData);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Ingredient</h1>
        <p className="text-gray-600 mt-2">Add a new ingredient to your inventory</p>
      </div>

      {searchParams.error === 'duplicate_name' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Ingredient Already Exists</h3>
              <p className="text-red-700 text-sm mt-1">
                You already have an ingredient named "{searchParams.name || 'this name'}" in your inventory. 
                Please choose a different name or edit the existing ingredient.
              </p>
            </div>
          </div>
        </div>
      )}

      <IngredientForm 
        companyId={companyId || undefined}
        suppliers={suppliers}
        onSubmit={handleSubmit}
        initialData={searchParams.name ? { name: searchParams.name } : undefined}
      />
      
      <div className="mt-6">
        <Link 
          href="/dashboard/ingredients" 
          className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          ← Back to Ingredients
        </Link>
      </div>
    </div>
  );
}