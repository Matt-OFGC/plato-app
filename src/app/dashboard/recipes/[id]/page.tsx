import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSimplifiedRecipe } from "../actionsSimplified";
import { deleteRecipe } from "../actions";
import { RecipeFormSimplified } from "@/components/RecipeFormSimplified";
import { getCurrentUserAndCompany } from "@/lib/current";

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    
    if (isNaN(id)) {
      return <div className="p-6">Invalid recipe ID</div>;
    }
    
    const { companyId } = await getCurrentUserAndCompany();
    const where = companyId ? { companyId } : {};
    
    const [recipe, ingredients, categories, shelfLifeOptions, storageOptions] = await Promise.all([
      prisma.recipe.findUnique({ 
        where: { id }, 
        include: { 
          items: {
            include: {
              ingredient: true
            }
          }
        } 
      }),
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
      prisma.category.findMany({ where, orderBy: { order: "asc" }, select: { id: true, name: true } }),
      prisma.shelfLifeOption.findMany({ where, orderBy: { order: "asc" }, select: { id: true, name: true } }),
      prisma.storageOption.findMany({ where, orderBy: { order: "asc" }, select: { id: true, name: true } }),
    ]);
    
    if (!recipe) {
      return <div className="p-6">Recipe not found</div>;
    }

  async function action(formData: FormData) {
    "use server";
    // Add the recipe ID to the form data for update
    formData.append("recipeId", id.toString());
    await createSimplifiedRecipe(formData);
  }


  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600 mt-2">Quick and easy recipe costing - works for sandwiches to cakes!</p>
        </div>
        <div className="flex items-center gap-4">
          <form action={async () => { 'use server'; await deleteRecipe(Number(id)); }} className="inline">
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
                  e.preventDefault();
                }
              }}
              className="text-red-600 hover:text-red-800 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors font-medium border border-red-200 hover:border-red-300"
            >
              Delete Recipe
            </button>
          </form>
          <Link href="/dashboard/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
            ← Back
          </Link>
        </div>
      </div>
      
      <RecipeFormSimplified 
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          packQuantity: i.packQuantity.toNumber(),
          packUnit: i.packUnit as any,
          packPrice: i.packPrice.toNumber(),
          densityGPerMl: i.densityGPerMl?.toNumber() || null,
        }))}
        categories={categories}
        shelfLifeOptions={shelfLifeOptions}
        storageOptions={storageOptions}
        initial={{
          name: recipe.name,
          recipeType: (recipe.portionsPerBatch && recipe.portionsPerBatch > 1) ? "batch" : "single",
          servings: recipe.portionsPerBatch || 1,
          method: recipe.method || undefined,
          imageUrl: recipe.imageUrl || undefined,
          categoryId: recipe.categoryId || undefined,
          shelfLifeId: recipe.shelfLifeId || undefined,
          storageId: recipe.storageId || undefined,
          bakeTime: recipe.bakeTime || undefined,
          bakeTemp: recipe.bakeTemp || undefined,
          items: recipe.items?.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity?.toString() || "0",
            unit: item.unit as any,
          })) || [],
        }}
        onSubmit={action}
      />
    </div>
  );
  } catch (error) {
    console.error('Error loading edit recipe page:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      id: id,
      companyId: companyId
    });
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Recipe</h1>
        <p className="text-gray-600 mb-4">There was an error loading the recipe. Please try again.</p>
        <details className="mb-4 p-4 bg-gray-100 rounded-lg">
          <summary className="cursor-pointer font-medium">Error Details (for debugging)</summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </details>
        <Link href="/dashboard/recipes" className="text-blue-600 hover:text-blue-800">
          ← Back to Recipes
        </Link>
      </div>
    );
  }
}