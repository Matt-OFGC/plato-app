"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

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
      // Security check: Verify the recipe belongs to the user's company
      const existingRecipe = await prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { name: true, companyId: true }
      });
      
      if (!existingRecipe || existingRecipe.companyId !== companyId) {
        throw new Error("Unauthorized: Recipe not found or doesn't belong to your company");
      }
      
      // Update existing recipe - delete old items first, then create new ones
      await prisma.recipeItem.deleteMany({
        where: { recipeId: recipeId }
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

export async function createRecipeUnified(formData: FormData) {
  try {
    const { companyId } = await getCurrentUserAndCompany();

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

    // Server-side validation
    if (!name || name.trim() === "") {
      throw new Error("Recipe name is required");
    }
    
    if (!yieldQuantity || yieldQuantity <= 0 || isNaN(yieldQuantity)) {
      throw new Error("Valid yield quantity is required");
    }
    
    if (!companyId) {
      // Get user info for better error message
      const { user } = await getCurrentUserAndCompany();
      const allMemberships = await prisma.membership.findMany({
        where: { userId: user.id },
        include: { company: { select: { id: true, name: true } } }
      });
      
      const inactiveMemberships = allMemberships.filter(m => !m.isActive);
      
      let errorMsg = "No company associated with your account.";
      if (allMemberships.length === 0) {
        errorMsg += " Please create or join a company first. You can do this by registering a company or accepting a team invitation.";
      } else if (inactiveMemberships.length > 0) {
        errorMsg += ` You have ${inactiveMemberships.length} inactive membership(s). Please contact support to activate your company membership.`;
      } else {
        errorMsg += " Please ensure you have an active company membership.";
      }
      
      // Log for debugging
      console.error('Recipe creation failed - no companyId', {
        userId: user.id,
        totalMemberships: allMemberships.length,
        activeMemberships: allMemberships.filter(m => m.isActive).length,
        inactiveMemberships: inactiveMemberships.length
      });
      
      throw new Error(errorMsg);
    }

    // Create the recipe data
    const recipeData: any = {
      name,
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
      companyId,
    };

    // Wrap everything in a transaction to ensure atomicity
    // If any part fails, the entire operation rolls back (no empty recipes!)
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the recipe first
      const createdRecipe = await tx.recipe.create({
        data: recipeData,
      });

      // Now create sections and items
      if (useSections) {
        const sectionsData = JSON.parse(formData.get("sections") as string);
        
        for (let idx = 0; idx < sectionsData.length; idx++) {
          const section = sectionsData[idx];
          const createdSection = await tx.recipeSection.create({
            data: {
              recipeId: createdRecipe.id,
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
            await tx.recipeItem.createMany({
              data: validItems.map((item: any) => ({
                recipeId: createdRecipe.id,
                sectionId: createdSection.id,
                ingredientId: item.ingredientId,
                quantity: parseFloat(item.quantity),
                unit: item.unit,
                price: item.price ? parseFloat(item.price) : null,
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
          await tx.recipeItem.createMany({
            data: validItems.map((item: any) => ({
              recipeId: createdRecipe.id,
              ingredientId: item.ingredientId,
              quantity: parseFloat(item.quantity),
              unit: item.unit,
              price: item.price ? parseFloat(item.price) : null,
              note: item.note || null,
            })),
          });
        }
      }

      // Check if should be added to wholesale catalogue
      const isWholesaleProduct = formData.get("isWholesaleProduct") === "on";
      if (isWholesaleProduct) {
        const wholesalePriceStr = formData.get("wholesalePrice") as string;
        
        // Calculate cost per unit (e.g., cost per slice if batch makes 24 slices)
        const wholesalePrice = wholesalePriceStr && parseFloat(wholesalePriceStr) > 0 
          ? parseFloat(wholesalePriceStr) 
          : 0;

        await tx.wholesaleProduct.create({
          data: {
            companyId: companyId!,
            recipeId: createdRecipe.id,
            price: wholesalePrice, // This should be price per unit (per slice)
            currency: "GBP",
            unit: `per ${yieldUnit}`, // e.g., "per each" or "per slice"
            category: recipeData.categoryId ? null : (categoryId ? null : null),
            isActive: true,
            sortOrder: 0,
          },
        });
      }

      return createdRecipe;
    });

    revalidatePath("/dashboard/recipes");
    redirect(`/dashboard/recipes/${recipe.id}`);
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
    const portionsPerBatchStr = formData.get("portionsPerBatch") as string | null;
    const portionsPerBatch = portionsPerBatchStr && portionsPerBatchStr.trim() !== "" ? parseInt(portionsPerBatchStr) : null;

    // Server-side validation
    if (!recipeId || isNaN(recipeId)) {
      throw new Error("Invalid recipe ID");
    }
    
    // Security check: Verify the recipe belongs to the user's company
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { name: true, companyId: true }
    });
    
    if (!existingRecipe || existingRecipe.companyId !== companyId) {
      throw new Error("Unauthorized: Recipe not found or doesn't belong to your company");
    }
    
    if (!name || name.trim() === "") {
      throw new Error("Recipe name is required");
    }
    
    if (!yieldQuantity || yieldQuantity <= 0 || isNaN(yieldQuantity)) {
      throw new Error("Valid yield quantity is required");
    }

    // Delete all existing items and sections
    await Promise.all([
      prisma.recipeItem.deleteMany({ where: { recipeId } }),
      prisma.recipeSection.deleteMany({ where: { recipeId } }),
    ]);

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
      portionsPerBatch: portionsPerBatch,
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
              price: item.price ? parseFloat(item.price) : null,
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
            price: item.price ? parseFloat(item.price) : null,
            note: item.note || null,
          })),
        });
      }
    }

    // Handle wholesale product sync
    const isWholesaleProduct = formData.get("isWholesaleProduct") === "on";
    const wholesalePriceStr = formData.get("wholesalePrice") as string;
    const wholesalePrice = wholesalePriceStr && parseFloat(wholesalePriceStr) > 0 
      ? parseFloat(wholesalePriceStr) 
      : null;

    // Check if wholesale product already exists for this recipe
    const existingWholesaleProduct = await prisma.wholesaleProduct.findFirst({
      where: {
        recipeId: recipeId,
        companyId: companyId!,
      },
    });

    if (isWholesaleProduct) {
      // Use wholesale price if provided, otherwise default to 0
      // This should be price per unit (per slice/piece)
      const priceToUse = wholesalePrice || 0;
      
      if (existingWholesaleProduct) {
        // Update existing wholesale product
        await prisma.wholesaleProduct.update({
          where: { id: existingWholesaleProduct.id },
          data: {
            price: priceToUse,
            unit: `per ${yieldUnit}`, // e.g., "per slice", "per each"
            category: categoryId ? null : null,
            isActive: true,
          },
        });
      } else {
        // Create new wholesale product
        await prisma.wholesaleProduct.create({
          data: {
            companyId: companyId!,
            recipeId: recipeId,
            price: priceToUse,
            currency: "GBP",
            unit: `per ${yieldUnit}`, // e.g., "per slice", "per each"
            isActive: true,
            sortOrder: 0,
          },
        });
      }
    } else if (existingWholesaleProduct) {
      // If unchecked and product exists, mark as inactive (don't delete to preserve history)
      await prisma.wholesaleProduct.update({
        where: { id: existingWholesaleProduct.id },
        data: { isActive: false },
      });
    }

    revalidatePath(`/dashboard/recipes/${recipeId}`);
    revalidatePath("/dashboard/recipes");
    revalidatePath("/dashboard/wholesale/products");
    
    // Don't redirect - just revalidate so the component can handle the state
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

