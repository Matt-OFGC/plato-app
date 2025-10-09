import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createSimplifiedRecipe } from "../actionsSimplified";
import { RecipeFormSimplified } from "@/components/RecipeFormSimplified";
import { getCurrentUserAndCompany } from "@/lib/current";

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
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
  
  if (!recipe) return <div className="p-6">Recipe not found</div>;

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
          <p className="text-gray-600 mt-2">Update your recipe with automatic cost calculation and sections</p>
        </div>
        <Link href="/dashboard/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          ← Back to Recipes
        </Link>
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
          recipeType: recipe.portionsPerBatch ? "batch" : "single",
          servings: recipe.portionsPerBatch || 1,
          imageUrl: recipe.imageUrl || undefined,
          method: recipe.method || undefined,
          bakeTime: recipe.bakeTime || undefined,
          bakeTemp: recipe.bakeTemp || undefined,
          categoryId: recipe.categoryId || undefined,
          shelfLifeId: recipe.shelfLifeId || undefined,
          storageId: recipe.storageId || undefined,
          items: recipe.items.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity.toString(),
            unit: item.unit as any,
          })),
        }}
        onSubmit={action}
      />
    </div>
  );
}