import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateRecipeWithSections } from "../actionsWithSections";
import { UnifiedRecipeForm } from "@/components/UnifiedRecipeForm";
import { getCurrentUserAndCompany } from "@/lib/current";

interface Props { params: Promise<{ id: string }> }

export default async function EditRecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const { companyId } = await getCurrentUserAndCompany();
  const where = companyId ? { companyId } : {};
  
  const [recipe, ingredients, allRecipes, categories, shelfLifeOptions, storageOptions] = await Promise.all([
    prisma.recipe.findUnique({ 
      where: { id }, 
      include: { 
        items: {
          include: {
            ingredient: true,
            section: true
          }
        },
        sections: {
          orderBy: { order: 'asc' }
        },
        subRecipes: {
          include: {
            subRecipe: true
          }
        }
      } 
    }),
    prisma.ingredient.findMany({ where, orderBy: { name: "asc" } }),
    prisma.recipe.findMany({ where, orderBy: { name: "asc" }, include: { items: true } }),
    prisma.category.findMany({ where, orderBy: { name: "asc" } }),
    prisma.shelfLifeOption.findMany({ where, orderBy: { name: "asc" } }),
    prisma.storageOption.findMany({ where, orderBy: { name: "asc" } }),
  ]);
  
  if (!recipe) return <div className="p-6">Recipe not found</div>;

  async function action(formData: FormData) {
    "use server";
    await updateRecipeWithSections(id, formData);
  }

  // Group items by section
  const sectionsData = recipe.sections.map(section => {
    const sectionItems = recipe.items
      .filter(item => item.sectionId === section.id)
      .map(item => ({
        id: String(item.id),
        ingredientId: item.ingredientId,
        quantity: Number(item.quantity),
        unit: item.unit as any,
        note: item.note || undefined,
      }));
    
    return {
      id: String(section.id),
      title: section.title,
      description: section.description || undefined,
      method: section.method || undefined,
      order: section.order,
      items: sectionItems,
    };
  });

  // Handle items without sections (legacy recipes)
  const unsectionedItems = recipe.items
    .filter(item => !item.sectionId)
    .map(item => ({
      ingredientId: item.ingredientId,
      quantity: Number(item.quantity),
      unit: item.unit as any,
    }));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Recipe</h1>
          <p className="text-gray-600 mt-2">Update your recipe with automatic cost calculation and sections</p>
        </div>
        <Link href="/dashboard/recipes" className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          ← Back to Recipes
        </Link>
      </div>

      <UnifiedRecipeForm
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          packQuantity: Number(i.packQuantity),
          packUnit: i.packUnit as any,
          packPrice: Number(i.packPrice),
          densityGPerMl: i.densityGPerMl == null ? null : Number(i.densityGPerMl),
        }))}
        allRecipes={allRecipes
          .filter(r => r.id !== id) // Exclude current recipe from sub-recipes
          .map((r) => ({
            id: r.id,
            name: r.name,
            yieldQuantity: Number(r.yieldQuantity),
            yieldUnit: r.yieldUnit as any,
            items: r.items.map(item => ({
              ingredientId: item.ingredientId,
              quantity: Number(item.quantity),
              unit: item.unit as any,
            })),
          }))
        }
        categories={categories}
        shelfLifeOptions={shelfLifeOptions}
        storageOptions={storageOptions}
        initial={{
          name: recipe.name,
          description: recipe.description || undefined,
          yieldQuantity: Number(recipe.yieldQuantity),
          yieldUnit: recipe.yieldUnit as any,
          imageUrl: recipe.imageUrl || undefined,
          method: recipe.method || undefined,
          isSubRecipe: recipe.isSubRecipe || false,
          bakeTime: recipe.bakeTime ? String(recipe.bakeTime) : undefined,
          bakeTemp: recipe.bakeTemp ? String(recipe.bakeTemp) : undefined,
          category: recipe.category || undefined,
          shelfLife: recipe.shelfLife || undefined,
          storage: recipe.storage || undefined,
          sellingPrice: recipe.sellingPrice ? Number(recipe.sellingPrice) : null,
          portionsPerBatch: recipe.portionsPerBatch || null,
          sections: sectionsData,
          subRecipes: recipe.subRecipes.map(sr => ({
            id: String(sr.id),
            subRecipeId: sr.subRecipeId,
            quantity: Number(sr.quantity),
            unit: sr.unit as any,
            note: sr.note || undefined,
          })),
        }}
        onSubmit={action}
      />
    </div>
  );
}