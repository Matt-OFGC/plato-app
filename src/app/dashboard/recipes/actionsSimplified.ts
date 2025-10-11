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
    const recipeId = formData.get("recipeId") ? parseInt(formData.get("recipeId") as string) : null;
    
    // Optional fields
    const method = formData.get("method") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const shelfLifeId = formData.get("shelfLifeId") ? parseInt(formData.get("shelfLifeId") as string) : null;
    const storageId = formData.get("storageId") ? parseInt(formData.get("storageId") as string) : null;
    const bakeTime = formData.get("bakeTime") ? parseInt(formData.get("bakeTime") as string) : null;
    const bakeTemp = formData.get("bakeTemp") ? parseInt(formData.get("bakeTemp") as string) : null;

    // Parse ingredients
    const ingredientIds = formData.getAll("ingredientId").map(id => parseInt(id as string));
    const quantities = formData.getAll("quantity");
    const units = formData.getAll("unit");

    if (!name || ingredientIds.length === 0) {
      throw new Error("Recipe name and at least one ingredient required");
    }

    // Create or update the recipe
    const recipeData = {
      name,
      // Smart defaults based on recipe type
      yieldQuantity: 1,  // Always 1 for the "thing" being made
      yieldUnit: "each" as const, // Always "each" (1 sandwich, 1 cake, 1 pot of soup)
      portionsPerBatch: recipeType === "single" ? 1 : servings,
      // Optional fields
      ...(method && { method }),
      ...(imageUrl && { imageUrl }),
      ...(categoryId && { categoryId }),
      ...(shelfLifeId && { shelfLifeId }),
      ...(storageId && { storageId }),
      ...(bakeTime && { bakeTime }),
      ...(bakeTemp && { bakeTemp }),
    };

    const itemsData = ingredientIds
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
      .filter(Boolean) as any;

    let recipe;
    if (recipeId) {
      // Update existing recipe - delete old items first, then create new ones
      await prisma.recipeItem.deleteMany({
        where: { recipeId: recipeId }
      });
      
      // First get the existing recipe to check if we need to handle name conflicts
      const existingRecipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { name: true }
      });
      
      // Only update name if it's different from the existing name
      const updateData: any = { ...recipeData };
      if (existingRecipe?.name === recipeData.name) {
        delete updateData.name;
      }
      
      recipe = await prisma.recipe.update({
        where: { id: recipeId },
        data: {
          ...updateData,
          items: {
            create: itemsData,
          },
        },
      });
    } else {
      // Create new recipe
      recipe = await prisma.recipe.create({
        data: {
          ...recipeData,
          companyId,
          items: {
            create: itemsData,
          },
        },
      });
    }

    revalidatePath("/dashboard/recipes");
    redirect("/dashboard/recipes");
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
}

export async function updateRecipeUnified(formData: FormData) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

    const recipeId = parseInt(formData.get("recipeId") as string);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const yieldQuantity = parseFloat(formData.get("yieldQuantity") as string);
    const yieldUnit = formData.get("yieldUnit") as string;
    const method = formData.get("method") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const shelfLifeId = formData.get("shelfLifeId") ? parseInt(formData.get("shelfLifeId") as string) : null;
    const storageId = formData.get("storageId") ? parseInt(formData.get("storageId") as string) : null;
    const bakeTime = formData.get("bakeTime") ? parseInt(formData.get("bakeTime") as string) : null;
    const bakeTemp = formData.get("bakeTemp") ? parseInt(formData.get("bakeTemp") as string) : null;
    const useSections = formData.get("useSections") === "true";

    if (!name) {
      throw new Error("Recipe name required");
    }

    // Delete all existing items and sections
    await Promise.all([
      prisma.recipeItem.deleteMany({ where: { recipeId } }),
      prisma.recipeSection.deleteMany({ where: { recipeId } }),
    ]);

    // Get the existing recipe to check name conflicts
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { name: true }
    });

    // Prepare update data
    const updateData: any = {
      yieldQuantity,
      yieldUnit,
      description: description || null,
      method: method || null,
      imageUrl: imageUrl || null,
      categoryId: categoryId || null,
      shelfLifeId: shelfLifeId || null,
      storageId: storageId || null,
      bakeTime: bakeTime || null,
      bakeTemp: bakeTemp || null,
    };

    // Only update name if it's different
    if (existingRecipe?.name !== name) {
      updateData.name = name;
    }

    // Update the recipe first without items/sections
    await prisma.recipe.update({
      where: { id: recipeId },
      data: updateData,
    });

    // Now create sections and items
    if (useSections) {
      const sectionsData = JSON.parse(formData.get("sections") as string);
      
      for (let idx = 0; idx < sectionsData.length; idx++) {
        const section = sectionsData[idx];
        const createdSection = await prisma.recipeSection.create({
          data: {
            recipeId: recipeId,
            title: section.title,
            description: section.description || null,
            method: section.method || null,
            bakeTemp: section.bakeTemp ? parseInt(section.bakeTemp) : null,
            bakeTime: section.bakeTime ? parseInt(section.bakeTime) : null,
            order: idx,
          },
        });

        // Create items for this section
        const validItems = section.items.filter(
          (item: any) => item.ingredientId && parseFloat(item.quantity) > 0
        );

        if (validItems.length > 0) {
          await prisma.recipeItem.createMany({
            data: validItems.map((item: any) => ({
              recipeId: recipeId,
              sectionId: createdSection.id,
              ingredientId: item.ingredientId,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              note: item.note || null,
            })),
          });
        }
      }
    } else {
      const itemsData = JSON.parse(formData.get("recipeItems") as string);
      const validItems = itemsData.filter(
        (item: any) => item.ingredientId && parseFloat(item.quantity) > 0
      );

      if (validItems.length > 0) {
        await prisma.recipeItem.createMany({
          data: validItems.map((item: any) => ({
            recipeId: recipeId,
            ingredientId: item.ingredientId,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            note: item.note || null,
          })),
        });
      }
    }

    revalidatePath(`/dashboard/recipes/${recipeId}`);
    revalidatePath("/dashboard/recipes");
    
    // Don't redirect - just revalidate so the component can handle the state
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

