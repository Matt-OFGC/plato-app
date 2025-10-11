import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSimplifiedRecipe } from "../actionsSimplified";
import { RecipeCreateForm } from "@/components/RecipeCreateForm";
import { getCurrentUserAndCompany } from "@/lib/current";

interface NewRecipePageProps {
  searchParams: Promise<{
    error?: string;
    name?: string;
  }>;
}

export default async function NewRecipePage({ searchParams }: NewRecipePageProps) {
  const params = await searchParams;
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  
  // Fetch all required data for the form
  const [ingredientsRaw, categories, shelfLifeOptions, storageOptions] = await Promise.all([
    prisma.ingredient.findMany({ 
      where, 
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        packQuantity: true,
        packUnit: true,
        packPrice: true,
        densityGPerMl: true,
      }
    }),
    prisma.category.findMany({ 
      where, 
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
    prisma.shelfLifeOption.findMany({ 
      where, 
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
    prisma.storageOption.findMany({ 
      where, 
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
  ]);
  
  // Convert Decimal types to numbers
  const ingredients = ingredientsRaw.map(ing => ({
    ...ing,
    packQuantity: ing.packQuantity.toNumber(),
    packPrice: ing.packPrice.toNumber(),
    densityGPerMl: ing.densityGPerMl?.toNumber() || null,
  }));

  async function action(formData: FormData) {
    "use server";
    await createSimplifiedRecipe(formData);
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Create New Recipe
          </h1>
          <p className="text-gray-600 text-lg">Design your recipe with ingredients, costs, and instructions</p>
        </div>
        <Link 
          href="/dashboard/recipes" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-6 py-3 rounded-xl hover:bg-white/50 transition-all font-medium border border-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Recipes
        </Link>
      </div>
      
      {companyId == null ? (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-sm text-yellow-900 mb-8 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">No Company Found</p>
              <p className="text-xs text-yellow-800 mt-1">Please ensure your account is linked to a company</p>
            </div>
          </div>
        </div>
      ) : null}

      {params.error === 'duplicate_name' && (
        <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-red-900 font-semibold text-lg">Recipe Already Exists</h3>
              <p className="text-red-800 text-sm mt-1">
                A recipe named <strong>"{params.name || 'this name'}"</strong> already exists. Please choose a different name.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <RecipeCreateForm 
        ingredients={ingredients}
        categories={categories}
        shelfLifeOptions={shelfLifeOptions}
        storageOptions={storageOptions}
        onSubmit={action}
      />
    </div>
  );
}


