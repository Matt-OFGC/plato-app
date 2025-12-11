"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { revalidatePath } from "next/cache";

export async function saveSellPrice(recipeId: number, sellPrice: number) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    // Verify recipe belongs to user's company
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { companyId: true }
    });

    if (!recipe || recipe.companyId !== companyId) {
      throw new Error("Unauthorized");
    }

    // Update just the selling price
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        sellingPrice: sellPrice,
        lastPriceUpdate: new Date(),
      },
    });

    revalidatePath(`/dashboard/recipes/${recipeId}`);
    revalidatePath('/dashboard/recipes');
    
    return { success: true };
  } catch (error) {
    console.error("Error saving sell price:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save sell price";
    return { success: false, error: errorMessage };
  }
}

export async function saveRecipe(data: {
  recipeId: number | null;
  name?: string;
  yieldQuantity?: number;
  yieldUnit?: string;
  category?: string;
  storage?: string;
  shelfLife?: string;
  sellPrice?: number;
  description?: string;
  imageUrl?: string;
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

    if (!companyId) {
      throw new Error("No company associated with your account");
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

    // Wrap everything in a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let recipeId: number;

      if (data.recipeId === null) {
        // Create new recipe
        if (!data.name || !data.name.trim()) {
          throw new Error("Recipe name is required");
        }
        if (!data.yieldQuantity || data.yieldQuantity <= 0) {
          throw new Error("Valid yield quantity is required");
        }

        const newRecipe = await tx.recipe.create({
          data: {
            name: data.name.trim(),
            yieldQuantity: data.yieldQuantity,
            yieldUnit: data.yieldUnit || "each",
            category: data.category || null,
            storage: data.storage || null,
            storageId: storageOption?.id || null,
            shelfLife: data.shelfLife || null,
            shelfLifeId: shelfLifeOption?.id || null,
            sellingPrice: data.sellPrice || null,
            lastPriceUpdate: data.sellPrice ? new Date() : undefined,
            method: data.description || null,
            imageUrl: data.imageUrl || null,
            companyId,
          },
        });
        recipeId = newRecipe.id;
      } else {
        // Update existing recipe
        const existingRecipe = await tx.recipe.findUnique({
          where: { id: data.recipeId },
          select: { companyId: true }
        });

        if (!existingRecipe || existingRecipe.companyId !== companyId) {
          throw new Error("Unauthorized");
        }

        // Update recipe basic info
        await tx.recipe.update({
          where: { id: data.recipeId },
          data: {
            ...(data.name && { name: data.name.trim() }),
            ...(data.yieldQuantity && { yieldQuantity: data.yieldQuantity }),
            ...(data.yieldUnit && { yieldUnit: data.yieldUnit }),
            category: data.category || null,
            storage: data.storage || null,
            storageId: storageOption?.id || null,
            shelfLife: data.shelfLife || null,
            shelfLifeId: shelfLifeOption?.id || null,
            sellingPrice: data.sellPrice || null,
            lastPriceUpdate: data.sellPrice ? new Date() : undefined,
            ...(data.description !== undefined && { method: data.description }),
            ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          },
        });
        recipeId = data.recipeId;

        // Delete existing sections and items
        await tx.recipeItem.deleteMany({
          where: { 
            recipeId: data.recipeId,
            sectionId: { not: null }
          }
        });
        await tx.recipeSection.deleteMany({
          where: { recipeId: data.recipeId }
        });
      }

      // Create new sections with instructions and ingredients
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const methodText = step.instructions
          .filter(line => line.trim() !== "")
          .join('\n')
          .trim();
        
        const newSection = await tx.recipeSection.create({
          data: {
            recipeId,
            title: step.title || `Step ${i + 1}`,
            description: step.title || null,
            method: methodText || null,
            order: i,
            bakeTemp: step.temperatureC || null,
            bakeTime: step.durationMin || null,
          }
        });

        // Add ingredients to this section
        const stepIngredients = data.ingredients.filter(ing => ing.stepId === step.id);
        
        for (const ing of stepIngredients) {
          const dbIngredient = await tx.ingredient.findFirst({
            where: { 
              name: ing.name,
              companyId 
            }
          });

          if (dbIngredient) {
            await tx.recipeItem.create({
              data: {
                recipeId,
                ingredientId: dbIngredient.id,
                quantity: ing.quantity,
                unit: ing.unit as any,
                sectionId: newSection.id,
              }
            });
          }
        }
      }

      return recipeId;
    });

    revalidatePath(`/dashboard/recipes/${result}`);
    revalidatePath('/dashboard/recipes');
    
    return { success: true, recipeId: result };
  } catch (error) {
    console.error("Error saving recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save recipe";
    return { success: false, error: errorMessage };
  }
}

export async function saveRecipeChanges(data: {
  recipeId: number;
  category?: string;
  storage?: string;
  shelfLife?: string;
  sellPrice?: number;
  description?: string;
  imageUrl?: string;
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
        sellingPrice: data.sellPrice || null,
        lastPriceUpdate: data.sellPrice ? new Date() : undefined,
        ...(data.description !== undefined && { method: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });

    // 2. Delete recipe items that are in sections (they'll be recreated)
    await prisma.recipeItem.deleteMany({
      where: { 
        recipeId: data.recipeId,
        sectionId: { not: null }
      }
    });

    // 3. Delete existing sections
    await prisma.recipeSection.deleteMany({
      where: { recipeId: data.recipeId }
    });

    // 4. Create new sections with instructions and ingredients
    for (let i = 0; i < data.steps.length; i++) {
      const step = data.steps[i];
      // Filter out empty lines when saving, then join
      const methodText = step.instructions
        .filter(line => line.trim() !== "")
        .join('\n')
        .trim();
      
      // Create the section
      const newSection = await prisma.recipeSection.create({
        data: {
          recipeId: data.recipeId,
          title: step.title || `Step ${i + 1}`,
          description: step.title || null,
          method: methodText || null,
          order: i,
          bakeTemp: step.temperatureC || null,
          bakeTime: step.durationMin || null,
          // hasTimer field commented out until database is updated
          // hasTimer: step.hasTimer || false,
        }
      });

      // 5. Add ingredients to this section
      const stepIngredients = data.ingredients.filter(ing => ing.stepId === step.id);
      
      for (const ing of stepIngredients) {
        // Find the ingredient in the database by name
        const dbIngredient = await prisma.ingredient.findFirst({
          where: { 
            name: ing.name,
            companyId 
          }
        });

        if (dbIngredient) {
          // Create recipe item linked to this section
          await prisma.recipeItem.create({
            data: {
              recipeId: data.recipeId,
              ingredientId: dbIngredient.id,
              quantity: ing.quantity,
              unit: ing.unit as any, // Type assertion needed for Prisma enum
              sectionId: newSection.id,
            }
          });
        }
      }
    }

    revalidatePath(`/dashboard/recipes/${data.recipeId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error saving recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
    return { success: false, error: errorMessage };
  }
}

export async function deleteRecipe(id: number) {
  try {
    const { companyId, user } = await getCurrentUserAndCompany();
    
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
      select: { companyId: true, name: true },
    });
    
    // Security check: Verify recipe belongs to user's company
    if (!existingRecipe || existingRecipe.companyId !== companyId) {
      throw new Error("Unauthorized: Cannot delete recipe from another company");
    }
    
    await prisma.recipe.delete({ where: { id } });
    
    // Audit deletion
    if (user && companyId) {
      const { auditLog } = await import("@/lib/audit-log");
      await auditLog.recipeDeleted(user.id, id, existingRecipe.name, companyId);
    }
    
    revalidatePath("/dashboard/recipes");
    revalidatePath(`/dashboard/recipes/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting recipe:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete recipe";
    throw new Error(errorMessage);
  }
}

