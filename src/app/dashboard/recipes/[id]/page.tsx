import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import RecipeClient from "./RecipeClient";
import type { RecipeMock, Ingredient, RecipeStep } from "@/app/lib/mocks/recipe";

export const dynamic = 'force-dynamic';

interface Props { 
  params: Promise<{ id: string }> 
}

export default async function RecipePage({ params }: Props) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  
  const { companyId } = await getCurrentUserAndCompany();
  
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      sections: {
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
      items: {
        include: {
          ingredient: true,
        },
      },
    },
  });

  if (!recipe) {
    redirect("/dashboard/recipes");
  }
  
  // Security check: Verify recipe belongs to user's company
  if (recipe.companyId !== companyId) {
    redirect("/dashboard/recipes");
  }

  // Fetch categories, storage, shelf life options, and ingredients for dropdowns
  const [categories, storageOptions, shelfLifeOptions, availableIngredients] = await Promise.all([
    prisma.category.findMany({
      where: { companyId },
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
    prisma.storageOption.findMany({
      where: { companyId },
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
    prisma.shelfLifeOption.findMany({
      where: { companyId },
      orderBy: { order: "asc" },
      select: { id: true, name: true }
    }),
    prisma.ingredient.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      select: { 
        id: true, 
        name: true, 
        packUnit: true,
        packPrice: true,
        packQuantity: true
      }
    }),
  ]);

  // Transform database recipe to match the new UI format
  const transformedRecipe: RecipeMock = {
    id: recipe.id.toString(),
    title: recipe.name,
    category: recipe.category || undefined,
    imageUrl: recipe.imageUrl || undefined,
    baseServings: Number(recipe.yieldQuantity),
    allergens: (recipe as any).allergens as string[] | undefined,
    storage: recipe.storage || undefined,
    shelfLife: recipe.shelfLife || undefined,
    notes: (recipe as any).notes || undefined,
    
    // Transform sections to steps
    // If no sections, create a single step from the recipe method
    steps: recipe.sections.length > 0
      ? recipe.sections.map((section, index) => ({
          id: section.id.toString(),
          title: section.title || section.description || `Step ${index + 1}`,
          // Use database values (bakeTemp, bakeTime, hasTimer)
          temperatureC: section.bakeTemp ? Number(section.bakeTemp) : undefined,
          durationMin: section.bakeTime ? Number(section.bakeTime) : undefined,
          hasTimer: section.hasTimer,
          instructions: section.method ? section.method.split('\n').filter(Boolean) : 
                       section.description ? [section.description] : [],
        })) as RecipeStep[]
      : [{
          id: '1',
          title: 'Instructions',
          temperatureC: 180, // Demo data
          durationMin: 25,   // Demo data
          hasTimer: true,    // Demo data
          instructions: recipe.method ? recipe.method.split('\n').filter(Boolean) : [],
        }] as RecipeStep[],
    
    // Transform items to ingredients
    // Use section items if they exist, otherwise use flat items
    ingredients: recipe.sections.length > 0 && recipe.sections.some(s => s.items.length > 0)
      ? recipe.sections.flatMap((section) => 
          section.items.map((item) => {
            // Calculate cost per unit
            const costPerUnit = item.ingredient.packPrice && item.ingredient.packQuantity
              ? Number(item.ingredient.packPrice) / Number(item.ingredient.packQuantity)
              : undefined;
            
            return {
              id: `item-${item.id}`,
              name: item.ingredient.name,
              unit: item.unit as Ingredient["unit"],
              quantity: Number(item.quantity),
              costPerUnit,
              stepId: section.id.toString(),
            } as Ingredient;
          })
        )
      : recipe.items.map((item) => {
          const costPerUnit = item.ingredient.packPrice && item.ingredient.packQuantity
            ? Number(item.ingredient.packPrice) / Number(item.ingredient.packQuantity)
            : undefined;
          
          return {
            id: `item-${item.id}`,
            name: item.ingredient.name,
            unit: item.unit as Ingredient["unit"],
            quantity: Number(item.quantity),
            costPerUnit,
            // No stepId for flat items
          } as Ingredient;
        }),
  };

  // Transform ingredients for dropdown
  const ingredientsForDropdown = availableIngredients.map(ing => {
    const costPerUnit = ing.packPrice && ing.packQuantity
      ? Number(ing.packPrice) / Number(ing.packQuantity)
      : 0;
    return {
      id: ing.id,
      name: ing.name,
      unit: ing.packUnit,
      costPerUnit,
    };
  });

  return (
    <RecipeClient 
      recipe={transformedRecipe} 
      categories={categories}
      storageOptions={storageOptions}
      shelfLifeOptions={shelfLifeOptions}
      recipeId={recipe.id}
      availableIngredients={ingredientsForDropdown}
    />
  );
}
