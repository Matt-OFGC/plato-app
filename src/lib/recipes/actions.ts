/**
 * Unified Recipe Actions
 * 
 * This module provides all recipe-related server actions in one place.
 * It replaces the scattered actions across multiple files and provides
 * consistent security, validation, and error handling.
 */

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  verifyRecipeOwnership, 
  verifyIngredientOwnership, 
  requireCompanyId,
  verifyUserPermissions 
} from "@/lib/security";
import {
  basicRecipeSchema,
  advancedRecipeSchema,
  simplifiedRecipeSchema,
  recipeUpdateSchema,
  wholesaleProductSchema,
  type BasicRecipeData,
  type AdvancedRecipeData,
  type SimplifiedRecipeData,
  type RecipeUpdateData
} from "@/lib/recipes/validation";

/**
 * Creates a basic recipe with ingredients
 * @param formData - Form data containing recipe information
 * @returns Created recipe
 */
export async function createBasicRecipe(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = Object.fromEntries(formData);
    const parsed = basicRecipeSchema.safeParse(rawData);
    
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
    }
    
    const data = parsed.data;
    const companyId = await requireCompanyId();
    
    // Verify all ingredients belong to the company
    for (const item of data.items) {
      await verifyIngredientOwnership(item.ingredientId, companyId);
    }
    
    // Create recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const createdRecipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          yieldQuantity: data.yieldQuantity,
          yieldUnit: data.yieldUnit,
          imageUrl: data.imageUrl,
          method: data.method,
          categoryId: data.categoryId,
          shelfLifeId: data.shelfLifeId,
          storageId: data.storageId,
          bakeTime: data.bakeTime,
          bakeTemp: data.bakeTemp,
          portionsPerBatch: data.portionsPerBatch,
          portionSize: data.portionSize,
          portionUnit: data.portionUnit,
          companyId,
          items: {
            create: data.items.map(item => ({
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unit: item.unit,
              note: item.note,
              price: item.price
            }))
          }
        },
        include: {
          items: {
            include: {
              ingredient: true
            }
          },
          categoryRef: true,
          storageRef: true,
          shelfLifeRef: true
        }
      });
      
      return createdRecipe;
    });
    
    revalidatePath("/dashboard/recipes");
    redirect("/dashboard/recipes");
    
  } catch (error) {
    console.error("Error creating basic recipe:", error);
    throw error;
  }
}

/**
 * Creates an advanced recipe with sections and sub-recipes
 * @param formData - Form data containing recipe information
 * @returns Created recipe
 */
export async function createAdvancedRecipe(formData: FormData) {
  try {
    // Parse sections and sub-recipes from form data
    const rawData = {
      ...Object.fromEntries(formData),
      sections: JSON.parse(formData.get("sections") as string || "[]"),
      subRecipes: JSON.parse(formData.get("subRecipes") as string || "[]")
    };
    
    const parsed = advancedRecipeSchema.safeParse(rawData);
    
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
    }
    
    const data = parsed.data;
    const companyId = await requireCompanyId();
    
    // Verify all ingredients belong to the company
    for (const section of data.sections) {
      for (const item of section.items) {
        await verifyIngredientOwnership(item.ingredientId, companyId);
      }
    }
    
    // Verify all sub-recipes belong to the company
    for (const subRecipe of data.subRecipes) {
      await verifyRecipeOwnership(subRecipe.subRecipeId, companyId);
    }
    
    // Create recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Create the main recipe
      const createdRecipe = await tx.recipe.create({
        data: {
          name: data.name,
          description: data.description,
          yieldQuantity: data.yieldQuantity,
          yieldUnit: data.yieldUnit,
          imageUrl: data.imageUrl,
          method: data.method,
          categoryId: data.categoryId,
          shelfLifeId: data.shelfLifeId,
          storageId: data.storageId,
          bakeTime: data.bakeTime,
          bakeTemp: data.bakeTemp,
          portionsPerBatch: data.portionsPerBatch,
          portionSize: data.portionSize,
          portionUnit: data.portionUnit,
          companyId
        }
      });
      
      // Create sections
      for (const sectionData of data.sections) {
        const section = await tx.recipeSection.create({
          data: {
            recipeId: createdRecipe.id,
            title: sectionData.title,
            description: sectionData.description,
            method: sectionData.method,
            order: sectionData.order,
            bakeTemp: sectionData.bakeTemp,
            bakeTime: sectionData.bakeTime,
            hasTimer: sectionData.hasTimer
          }
        });
        
        // Create items for this section
        for (const itemData of sectionData.items) {
          await tx.recipeItem.create({
            data: {
              recipeId: createdRecipe.id,
              sectionId: section.id,
              ingredientId: itemData.ingredientId,
              quantity: itemData.quantity,
              unit: itemData.unit,
              note: itemData.note,
              price: itemData.price
            }
          });
        }
      }
      
      // Create sub-recipes
      for (const subRecipeData of data.subRecipes) {
        await tx.recipeSubRecipe.create({
          data: {
            parentRecipeId: createdRecipe.id,
            subRecipeId: subRecipeData.subRecipeId,
            quantity: subRecipeData.quantity,
            unit: subRecipeData.unit,
            note: subRecipeData.note
          }
        });
      }
      
      return createdRecipe;
    });
    
    revalidatePath("/dashboard/recipes");
    redirect("/dashboard/recipes");
    
  } catch (error) {
    console.error("Error creating advanced recipe:", error);
    throw error;
  }
}

/**
 * Creates a simplified recipe for quick entry
 * @param formData - Form data containing recipe information
 * @returns Created recipe
 */
export async function createSimplifiedRecipe(formData: FormData) {
  try {
    const companyId = await requireCompanyId();
    
    // Parse ingredients from form data
    const ingredientIds = formData.getAll("ingredientId").map(id => parseInt(id as string));
    const quantities = formData.getAll("quantity").map(q => parseFloat(q as string));
    const units = formData.getAll("unit") as string[];
    
    const rawData = {
      ...Object.fromEntries(formData),
      ingredientIds,
      quantities,
      units
    };
    
    const parsed = simplifiedRecipeSchema.safeParse(rawData);
    
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
    }
    
    const data = parsed.data;
    
    // Verify all ingredients belong to the company
    for (const ingredientId of data.ingredientIds) {
      await verifyIngredientOwnership(ingredientId, companyId);
    }
    
    // Create recipe data
    const recipeData = {
      name: data.name,
      yieldQuantity: 1, // Always 1 for simplified recipes
      yieldUnit: "each" as const,
      portionsPerBatch: data.recipeType === "single" ? 1 : data.servings,
      method: data.method,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId,
      shelfLifeId: data.shelfLifeId,
      storageId: data.storageId,
      bakeTime: data.bakeTime,
      bakeTemp: data.bakeTemp,
      companyId
    };
    
    // Create items data
    const itemsData = data.ingredientIds
      .map((id, idx) => {
        const quantity = data.quantities[idx];
        const unit = data.units[idx];
        
        if (!quantity || !unit || id === 0) return null;
        
        return {
          ingredientId: id,
          quantity,
          unit
        };
      })
      .filter(Boolean) as any[];
    
    // Create recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      const createdRecipe = await tx.recipe.create({
        data: {
          ...recipeData,
          items: {
            create: itemsData
          }
        },
        include: {
          items: {
            include: {
              ingredient: true
            }
          }
        }
      });
      
      return createdRecipe;
    });
    
    revalidatePath("/dashboard/recipes");
    redirect("/dashboard/recipes");
    
  } catch (error) {
    console.error("Error creating simplified recipe:", error);
    throw error;
  }
}

/**
 * Updates an existing recipe
 * @param recipeId - The ID of the recipe to update
 * @param formData - Form data containing updated recipe information
 * @returns Updated recipe
 */
export async function updateRecipe(recipeId: number, formData: FormData) {
  try {
    const companyId = await requireCompanyId();
    
    // Verify recipe ownership
    await verifyRecipeOwnership(recipeId, companyId);
    
    // Parse and validate form data
    const rawData = Object.fromEntries(formData);
    const parsed = recipeUpdateSchema.safeParse({ ...rawData, id: recipeId });
    
    if (!parsed.success) {
      throw new Error(`Validation failed: ${parsed.error.issues[0].message}`);
    }
    
    const data = parsed.data;
    
    // Verify all ingredients belong to the company
    if (data.items) {
      for (const item of data.items) {
        await verifyIngredientOwnership(item.ingredientId, companyId);
      }
    }
    
    // Update recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Delete existing items and sections
      await Promise.all([
        tx.recipeItem.deleteMany({ where: { recipeId } }),
        tx.recipeSection.deleteMany({ where: { recipeId } }),
        tx.recipeSubRecipe.deleteMany({ where: { parentRecipeId: recipeId } })
      ]);
      
      // Update the main recipe
      const updatedRecipe = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          name: data.name,
          description: data.description,
          yieldQuantity: data.yieldQuantity,
          yieldUnit: data.yieldUnit,
          imageUrl: data.imageUrl,
          method: data.method,
          categoryId: data.categoryId,
          shelfLifeId: data.shelfLifeId,
          storageId: data.storageId,
          bakeTime: data.bakeTime,
          bakeTemp: data.bakeTemp,
          portionsPerBatch: data.portionsPerBatch,
          portionSize: data.portionSize,
          portionUnit: data.portionUnit
        }
      });
      
      // Recreate items if provided
      if (data.items && data.items.length > 0) {
        await tx.recipeItem.createMany({
          data: data.items.map(item => ({
            recipeId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unit: item.unit,
            note: item.note,
            price: item.price
          }))
        });
      }
      
      return updatedRecipe;
    });
    
    revalidatePath(`/dashboard/recipes/${recipeId}`);
    revalidatePath("/dashboard/recipes");
    
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error;
  }
}

/**
 * Deletes a recipe
 * @param recipeId - The ID of the recipe to delete
 */
export async function deleteRecipe(recipeId: number) {
  try {
    const companyId = await requireCompanyId();
    
    // Verify recipe ownership
    await verifyRecipeOwnership(recipeId, companyId);
    
    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id: recipeId }
    });
    
    revalidatePath("/dashboard/recipes");
    
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
}

/**
 * Creates or updates a wholesale product for a recipe
 * @param recipeId - The ID of the recipe
 * @param formData - Form data containing wholesale product information
 */
export async function updateWholesaleProduct(recipeId: number, formData: FormData) {
  try {
    const companyId = await requireCompanyId();
    
    // Verify recipe ownership
    await verifyRecipeOwnership(recipeId, companyId);
    
    const isWholesaleProduct = formData.get("isWholesaleProduct") === "on";
    const wholesalePriceStr = formData.get("wholesalePrice") as string;
    const wholesalePrice = wholesalePriceStr && parseFloat(wholesalePriceStr) > 0 
      ? parseFloat(wholesalePriceStr) 
      : null;
    
    // Check if wholesale product already exists
    const existingWholesaleProduct = await prisma.wholesaleProduct.findFirst({
      where: {
        recipeId: recipeId,
        companyId: companyId
      }
    });
    
    if (isWholesaleProduct) {
      const priceToUse = wholesalePrice || 0;
      
      if (existingWholesaleProduct) {
        // Update existing wholesale product
        await prisma.wholesaleProduct.update({
          where: { id: existingWholesaleProduct.id },
          data: {
            price: priceToUse,
            isActive: true
          }
        });
      } else {
        // Create new wholesale product
        await prisma.wholesaleProduct.create({
          data: {
            companyId: companyId,
            recipeId: recipeId,
            price: priceToUse,
            currency: "GBP",
            unit: "each",
            isActive: true,
            sortOrder: 0
          }
        });
      }
    } else if (existingWholesaleProduct) {
      // Mark as inactive if unchecked
      await prisma.wholesaleProduct.update({
        where: { id: existingWholesaleProduct.id },
        data: { isActive: false }
      });
    }
    
    revalidatePath(`/dashboard/recipes/${recipeId}`);
    revalidatePath("/dashboard/wholesale/products");
    
  } catch (error) {
    console.error("Error updating wholesale product:", error);
    throw error;
  }
}
