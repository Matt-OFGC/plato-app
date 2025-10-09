import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSimplifiedRecipe } from "../actionsSimplified";
import { RecipeFormSimplified } from "@/components/RecipeFormSimplified";
import { getCurrentUserAndCompany } from "@/lib/current";

interface NewRecipePageProps {
  searchParams: Promise<{
    error?: string;
    name?: string;
    mode?: string;
    edit?: string; // Recipe ID to edit
  }>;
}

export default async function NewRecipePage({ searchParams }: NewRecipePageProps) {
  const params = await searchParams;
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  
  const isEditMode = params.edit && !isNaN(Number(params.edit));
  const editRecipeId = isEditMode ? Number(params.edit) : null;
  
  // Fetch all required data for the form
  const [ingredientsRaw, categories, shelfLifeOptions, storageOptions, existingRecipe] = await Promise.all([
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
    // Fetch existing recipe if in edit mode
    isEditMode ? prisma.recipe.findUnique({
      where: { id: editRecipeId! },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    }) : Promise.resolve(null),
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
    // Add the recipe ID if we're in edit mode
    if (editRecipeId) {
      formData.append("recipeId", editRecipeId.toString());
    }
    await createSimplifiedRecipe(formData);
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? `Edit Recipe: ${existingRecipe?.name || ''}` : 'Create New Recipe'}
          </h1>
          <p className="text-gray-600 mt-2">Quick and easy recipe costing - works for sandwiches to cakes!</p>
        </div>
        <Link href="/dashboard/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          ← Back
        </Link>
      </div>
      
      {companyId == null ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            No company found for your account
          </div>
        </div>
      ) : null}

      {params.error === 'duplicate_name' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Recipe Already Exists</h3>
              <p className="text-red-700 text-sm mt-1">
                A recipe named "{params.name || 'this name'}" already exists. Please choose a different name.
              </p>
            </div>
          </div>
        </div>
      )}

      
      <RecipeFormSimplified 
        ingredients={ingredients}
        categories={categories}
        shelfLifeOptions={shelfLifeOptions}
        storageOptions={storageOptions}
        initial={existingRecipe ? {
          name: existingRecipe.name,
          recipeType: (existingRecipe.portionsPerBatch && existingRecipe.portionsPerBatch > 1) ? "batch" : "single",
          servings: existingRecipe.portionsPerBatch || 1,
          method: existingRecipe.method || undefined,
          imageUrl: existingRecipe.imageUrl || undefined,
          categoryId: existingRecipe.categoryId || undefined,
          shelfLifeId: existingRecipe.shelfLifeId || undefined,
          storageId: existingRecipe.storageId || undefined,
          bakeTime: existingRecipe.bakeTime || undefined,
          bakeTemp: existingRecipe.bakeTemp || undefined,
          items: existingRecipe.items?.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity?.toString() || "0",
            unit: item.unit as any,
          })) || [],
        } : undefined}
        onSubmit={action}
      />
    </div>
  );
}


