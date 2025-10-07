import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateRecipe } from "../actions";
import { RecipeForm } from "../RecipeForm";

interface Props { params: { id: string } }

export default async function EditRecipePage({ params }: Props) {
  const id = Number(params.id);
  const [recipe, ingredients] = await Promise.all([
    prisma.recipe.findUnique({ where: { id }, include: { items: true } }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!recipe) return <div className="p-6">Not found</div>;

  async function action(formData: FormData) {
    "use server";
    await updateRecipe(id, formData);
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Recipe</h1>
        <Link href="/recipes" className="text-blue-700 hover:underline">Back</Link>
      </div>
      {recipe.imageUrl ? (
        <img src={recipe.imageUrl} alt={recipe.name} className="h-48 w-full object-cover rounded border" />
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
        initial={{
          name: recipe.name,
          yieldQuantity: Number(recipe.yieldQuantity),
          yieldUnit: recipe.yieldUnit as any,
          imageUrl: recipe.imageUrl ?? undefined,
          items: recipe.items.map((it) => ({ ingredientId: it.ingredientId, quantity: Number(it.quantity), unit: it.unit as any })),
        }}
        onSubmit={action}
      />
    </div>
  );
}


