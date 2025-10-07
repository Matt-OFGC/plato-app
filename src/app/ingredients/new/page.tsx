import Link from "next/link";
import { createIngredient } from "../actions";
import { getCurrentUserAndCompany } from "@/lib/current";
import { IngredientForm } from "@/components/IngredientForm";
import { prisma } from "@/lib/prisma";

export default async function NewIngredientPage() {
  const { companyId } = await getCurrentUserAndCompany();
  
  // Get suppliers for the dropdown
  const suppliers = await prisma.supplier.findMany({
    where: { companyId },
    orderBy: { name: "asc" }
  });
  
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

      <IngredientForm 
        companyId={companyId || undefined}
        suppliers={suppliers}
        onSubmit={handleSubmit}
      />
      
      <div className="mt-6">
        <Link 
          href="/ingredients" 
          className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium"
        >
          ← Back to Ingredients
        </Link>
      </div>
    </div>
  );
}