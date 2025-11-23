import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import RecipeClient from "@/app/dashboard/recipes/[id]/RecipeClient";
import type { RecipeMock, Ingredient, RecipeStep } from "@/lib/mocks/recipe";
import { getUserFromSession } from "@/lib/auth-simple";
import { hasAppAccess } from "@/lib/user-app-subscriptions";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function BakeRecipePage({ params }: Props) {
  const user = await getUserFromSession();
  if (!user) redirect("/bake/login?redirect=/bake/recipes");

  // Verify user has access to Plato Bake
  const hasAccess = await hasAppAccess(user.id, "plato_bake");
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { id: idParam } = await params;
  const isNew = idParam === "new";
  
  const { companyId } = await getCurrentUserAndCompany();
  
  if (!isNew && (!companyId)) {
    redirect("/bake/recipes");
  }
  
  if (!isNew) {
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      redirect("/bake/recipes");
    }
  }

  // Re-export the rest of the logic from the dashboard recipe page
  // We'll import and use the same RecipeClient component
  const recipeId = isNew ? null : parseInt(idParam, 10);
  
  let recipe: RecipeMock | null = null;
  let categories: { id: number; name: string; description?: string | null; color?: string | null }[] = [];
  let storageOptions: { value: string; label: string }[] = [];
  let shelfLifeOptions: { value: string; label: string }[] = [];
  let availableIngredients: Ingredient[] = [];

  if (!isNew && recipeId && companyId) {
    try {
      // Fetch recipe with all related data
      const recipeRaw = await prisma.recipe.findUnique({
        where: { id: recipeId },
        include: {
          categoryRef: true,
          items: {
            include: {
              ingredient: {
                include: {
                  supplier: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
          sections: {
            include: {
              steps: {
                orderBy: { order: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (recipeRaw && recipeRaw.companyId === companyId) {
        // Transform to RecipeMock format
        recipe = {
          id: recipeRaw.id,
          name: recipeRaw.name,
          description: recipeRaw.description || "",
          yieldQuantity: recipeRaw.yieldQuantity.toString(),
          yieldUnit: recipeRaw.yieldUnit || "servings",
          imageUrl: recipeRaw.imageUrl || "",
          bakeTime: recipeRaw.bakeTime?.toString() || null,
          bakeTemp: recipeRaw.bakeTemp?.toString() || null,
          storage: recipeRaw.storage || null,
          shelfLife: recipeRaw.shelfLife || null,
          sellingPrice: recipeRaw.sellingPrice?.toString() || null,
          category: recipeRaw.categoryRef?.name || recipeRaw.category || null,
          items: recipeRaw.items.map((item) => ({
            id: item.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity.toString(),
            unit: item.unit || "g",
            ingredient: {
              id: item.ingredient.id,
              name: item.ingredient.name,
              packQuantity: item.ingredient.packQuantity.toString(),
              packUnit: item.ingredient.packUnit || "g",
              packPrice: item.ingredient.packPrice?.toString() || "0",
              supplier: item.ingredient.supplier?.name || null,
            },
          })),
          sections: recipeRaw.sections.map((section) => ({
            id: section.id,
            name: section.name || "",
            steps: section.steps.map((step) => ({
              id: step.id,
              instruction: step.instruction || "",
              order: step.order,
            })),
          })),
        };
      } else {
        redirect("/bake/recipes");
      }
    } catch (error) {
      console.error("Error fetching recipe:", error);
      redirect("/bake/recipes");
    }
  }

  // Fetch categories, storage options, shelf life options, and ingredients
  try {
    [categories, availableIngredients] = await Promise.all([
      prisma.category.findMany({
        where: { companyId: companyId || undefined },
        orderBy: { name: "asc" },
      }),
      companyId
        ? prisma.ingredient.findMany({
            where: { companyId },
            include: {
              supplier: true,
            },
            orderBy: { name: "asc" },
          })
        : Promise.resolve([]),
    ]);

    // Transform ingredients to Ingredient format
    availableIngredients = availableIngredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      packQuantity: ing.packQuantity.toString(),
      packUnit: ing.packUnit || "g",
      packPrice: ing.packPrice?.toString() || "0",
      supplier: ing.supplier?.name || null,
    }));

    // Storage and shelf life options (these could come from a config or database)
    storageOptions = [
      { value: "room", label: "Room Temperature" },
      { value: "refrigerated", label: "Refrigerated" },
      { value: "frozen", label: "Frozen" },
    ];

    shelfLifeOptions = [
      { value: "1", label: "1 day" },
      { value: "2", label: "2 days" },
      { value: "3", label: "3 days" },
      { value: "7", label: "1 week" },
      { value: "14", label: "2 weeks" },
      { value: "30", label: "1 month" },
    ];
  } catch (error) {
    console.error("Error fetching page data:", error);
  }

  return (
    <RecipeClient
      recipe={recipe}
      categories={categories}
      storageOptions={storageOptions}
      shelfLifeOptions={shelfLifeOptions}
      recipeId={recipeId}
      availableIngredients={availableIngredients}
      isNew={isNew}
    />
  );
}
