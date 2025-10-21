"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { revalidatePath } from "next/cache";

export async function saveRecipeChanges(data: {
  recipeId: number;
  category?: string;
  storage?: string;
  shelfLife?: string;
  ingredients: Array<{
    id: string;
    name: string;
    unit: string;
    quantity: number;
    stepId?: string;
  }>;
  steps: Array<{
    id: string;
    title: string;
    temperatureC?: number;
    durationMin?: number;
    hasTimer?: boolean;
    instructions: string[];
  }>;
}) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    // Verify recipe belongs to user's company
    const recipe = await prisma.recipe.findUnique({
      where: { id: data.recipeId },
      select: { companyId: true }
    });

    if (!recipe || recipe.companyId !== companyId) {
      throw new Error("Unauthorized");
    }

    // Find the storage and shelf life option IDs by name
    const [storageOption, shelfLifeOption] = await Promise.all([
      data.storage ? prisma.storageOption.findFirst({
        where: { name: data.storage, companyId },
        select: { id: true }
      }) : null,
      data.shelfLife ? prisma.shelfLifeOption.findFirst({
        where: { name: data.shelfLife, companyId },
        select: { id: true }
      }) : null,
    ]);

    // 1. Update recipe basic info
    await prisma.recipe.update({
      where: { id: data.recipeId },
      data: {
        category: data.category || null,
        storage: data.storage || null,
        storageId: storageOption?.id || null,
        shelfLife: data.shelfLife || null,
        shelfLifeId: shelfLifeOption?.id || null,
      },
    });

    // 2. First, unlink all recipe items from sections to preserve them
    await prisma.recipeItem.updateMany({
      where: { recipeId: data.recipeId },
      data: { sectionId: null }
    });

    // 3. Delete existing sections (items are now preserved)
    await prisma.recipeSection.deleteMany({
      where: { recipeId: data.recipeId }
    });

    // 4. Create new sections with instructions
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      const methodText = step.instructions.join('\n').trim();
      
      await prisma.recipeSection.create({
        data: {
          recipeId: data.recipeId,
          title: step.title || `Step ${i + 1}`,
          description: step.title || null,
          method: methodText || null, // Use null if empty instead of empty string
          order: i,
          bakeTemp: step.temperatureC || null,
          bakeTime: step.durationMin || null,
          hasTimer: step.hasTimer || false,
        }
      });
    }

    // Note: Ingredient updates not implemented yet
    // Would require creating/updating recipeItems with proper ingredient references

    revalidatePath(`/dashboard/recipes/${data.recipeId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
    return { success: false, error: errorMessage };
  }
}

