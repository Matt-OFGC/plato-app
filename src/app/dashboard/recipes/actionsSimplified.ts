"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSimplifiedRecipe(formData: FormData) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    const name = formData.get("name") as string;
    const recipeType = formData.get("recipeType") as "single" | "batch";
    const servings = parseInt(formData.get("servings") as string) || 1;

    // Parse ingredients
    const ingredientIds = formData.getAll("ingredientId").map(id => parseInt(id as string));
    const quantities = formData.getAll("quantity");
    const units = formData.getAll("unit");

    if (!name || ingredientIds.length === 0) {
      throw new Error("Recipe name and at least one ingredient required");
    }

    // Create the recipe with smart defaults based on type
    const recipe = await prisma.recipe.create({
      data: {
        name,
        companyId,
        // Smart defaults based on recipe type
        yieldQuantity: 1,  // Always 1 for the "thing" being made
        yieldUnit: "each", // Always "each" (1 sandwich, 1 cake, 1 pot of soup)
        portionsPerBatch: recipeType === "single" ? 1 : servings,
        items: {
          create: ingredientIds
            .map((id, idx) => {
              const quantity = parseFloat(quantities[idx] as string);
              const unit = units[idx] as any;
              
              if (!quantity || !unit || id === 0) return null;
              
              return {
                ingredientId: id,
                quantity,
                unit,
              };
            })
            .filter(Boolean) as any,
        },
      },
    });

    revalidatePath("/dashboard/recipes");
    redirect(`/dashboard/recipes/${recipe.id}`);
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
}

export async function updateSimplifiedRecipe(id: number, formData: FormData) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    const name = formData.get("name") as string;
    const recipeType = formData.get("recipeType") as "single" | "batch";
    const servings = parseInt(formData.get("servings") as string) || 1;

    // Parse ingredients
    const ingredientIds = formData.getAll("ingredientId").map(id => parseInt(id as string));
    const quantities = formData.getAll("quantity");
    const units = formData.getAll("unit");

    // Delete existing items
    await prisma.recipeItem.deleteMany({
      where: { recipeId: id },
    });

    // Update recipe
    await prisma.recipe.update({
      where: { id },
      data: {
        name,
        portionsPerBatch: recipeType === "single" ? 1 : servings,
        items: {
          create: ingredientIds
            .map((id, idx) => {
              const quantity = parseFloat(quantities[idx] as string);
              const unit = units[idx] as any;
              
              if (!quantity || !unit || id === 0) return null;
              
              return {
                ingredientId: id,
                quantity,
                unit,
              };
            })
            .filter(Boolean) as any,
        },
      },
    });

    revalidatePath("/dashboard/recipes");
    revalidatePath(`/dashboard/recipes/${id}`);
    redirect(`/dashboard/recipes/${id}`);
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

