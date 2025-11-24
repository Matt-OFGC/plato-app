"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserAndCompany } from "@/lib/current";
import { toBase, BaseUnit, Unit } from "@/lib/units";
import { canAddIngredient, updateIngredientCount } from "@/lib/subscription";
import { getAppAwareRouteForServer } from "@/lib/server-app-context";
// Temporarily disabled to fix build error
// import { isRecipesTrial } from "@/lib/features";

const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon", "each", "slices", "pinch", "dash", "large", "medium", "small"]);
const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);

const ingredientSchema = z.object({
  name: z.string().min(1),
  supplier: z.string().optional().nullable(),
  supplierId: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  packQuantity: z.coerce.number().positive(),
  packUnit: unitEnum,
  packPrice: z.coerce.number().nonnegative(),
  currency: z.string().min(1).default("GBP"),
  densityGPerMl: z
    .union([z.coerce.number().positive().nullable(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  allergens: z.string().optional().transform((v) => {
    try {
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  }),
  customConversions: z.string().optional().nullable().transform((v) => {
    // Validate and clean up the JSON
    if (!v || v === "" || v === "{}") return null;
    try {
      const parsed = JSON.parse(v);
      // Ensure it's a valid object
      if (typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return v;
    } catch {
      return null;
    }
  }),
  batchPricing: z.string().optional().nullable().transform((v) => {
    // Validate and clean up the JSON array
    if (!v || v === "" || v === "[]") return null;
    try {
      const parsed = JSON.parse(v);
      // Ensure it's a valid array
      if (!Array.isArray(parsed)) return null;
      // For bulk purchases, we store {packQuantity, packPrice, purchaseUnit, unitSize}
      // packPrice can be 0 for bulk purchases (price is stored at the purchase level)
      // For regular batch pricing, packPrice must be > 0
      const valid = parsed.every((tier: any) => {
        if (!tier || typeof tier.packQuantity !== 'number' || tier.packQuantity <= 0) {
          return false;
        }
        // If it has purchaseUnit, it's a bulk purchase - packPrice can be 0
        if (tier.purchaseUnit) {
          return typeof tier.packPrice === 'number' && tier.packPrice >= 0;
        }
        // Otherwise, it's regular batch pricing - packPrice must be > 0
        return typeof tier.packPrice === 'number' && tier.packPrice > 0;
      });
      return valid ? parsed : null;
    } catch {
      return null;
    }
  }),
  notes: z.string().optional().nullable(),
});

export async function createIngredient(formData: FormData) {
  try {
    const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      throw new Error("Validation failed");
    }

    const data = parsed.data;
    const { companyId, user } = await getCurrentUserAndCompany();
    const userId = user?.id;
    
    // Check subscription limits
    if (userId && !(await canAddIngredient(userId))) {
      throw new Error("Ingredient limit reached for your subscription");
    }
    
    // Check if ingredient with this name already exists for this company
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        name: data.name,
        companyId: companyId ?? null,
      },
    });

    if (existingIngredient) {
      throw new Error(`An ingredient named "${data.name}" already exists`);
    }
    
    // Convert the user-selected unit to a base unit for storage
    const { amount: baseQuantity, base: baseUnit } = toBase(
      data.packQuantity,
      data.packUnit as Unit,
      data.densityGPerMl ?? undefined
    );
    
    // Convert batch pricing quantities to base units if provided
    // For bulk purchases, preserve purchaseUnit and unitSize
    let batchPricingInBase = null;
    if (data.batchPricing && Array.isArray(data.batchPricing)) {
      batchPricingInBase = data.batchPricing.map(tier => {
        // If this is a bulk purchase (has purchaseUnit), preserve all fields
        if (tier.purchaseUnit) {
          return {
            packQuantity: tier.packQuantity, // Already in correct units (number of packs)
            packPrice: tier.packPrice,
            purchaseUnit: tier.purchaseUnit,
            unitSize: tier.unitSize, // Size per individual unit
          };
        }
        // Otherwise, convert to base units for regular batch pricing
        const { amount: tierBaseQty } = toBase(
          tier.packQuantity,
          data.packUnit as Unit,
          data.densityGPerMl ?? undefined
        );
        return {
          packQuantity: tierBaseQty,
          packPrice: tier.packPrice,
        };
      });
    }
    
    const ingredientData = {
      name: data.name,
      supplier: data.supplier ?? null,
      supplierId: data.supplierId,
      packQuantity: baseQuantity,
      packUnit: baseUnit as BaseUnit,
      originalUnit: data.packUnit as Unit,
      packPrice: data.packPrice,
      currency: data.currency,
      densityGPerMl: (data.densityGPerMl as number | null) ?? null,
      allergens: data.allergens,
      batchPricing: batchPricingInBase,
      customConversions: data.customConversions ?? null,
      notes: data.notes ?? null,
      companyId: companyId ?? undefined,
    };
    
        await prisma.ingredient.create({
          data: ingredientData,
        });
        
        // Update user's ingredient count
        if (userId) {
          await updateIngredientCount(userId);
        }
        
        // Revalidate both possible paths
        revalidatePath("/dashboard/ingredients");
        revalidatePath("/bake/ingredients");
        return { success: true };
  } catch (error) {
    console.error("Error in createIngredient:", error);
    // Check if it's a unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      throw new Error("An ingredient with this name already exists");
    }
    throw error instanceof Error ? error : new Error("Failed to create ingredient");
  }
}

export async function updateIngredient(id: number, formData: FormData) {
  // Log raw form data before validation
  const rawData = Object.fromEntries(formData);
  console.log('updateIngredient - Raw form data batchPricing:', rawData.batchPricing);
  console.log('updateIngredient - Raw form data:', {
    batchPricing: rawData.batchPricing,
    batchPricingType: typeof rawData.batchPricing,
    batchPricingLength: rawData.batchPricing ? String(rawData.batchPricing).length : 'N/A'
  });
  
  const parsed = ingredientSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error("Ingredient validation error:", parsed.error);
    redirect("/dashboard/ingredients?error=validation");
  }
  const data = parsed.data;
  console.log('updateIngredient - Parsed data batchPricing:', data.batchPricing);
  
  try {
    // Verify the ingredient belongs to the user's company
    const { companyId } = await getCurrentUserAndCompany();
    
    // Get existing ingredient to check ownership and if price changed
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id },
      select: { 
        packPrice: true,
        companyId: true,
      },
    });
    
    // Security check: Verify ingredient belongs to user's company
    if (!existingIngredient) {
      redirect("/dashboard/ingredients?error=not_found");
    }
    
    if (existingIngredient.companyId !== companyId) {
      const redirectPath = await getAppAwareRouteForServer("/dashboard/ingredients");
      redirect(`${redirectPath}?error=unauthorized`);
    }
    
    // Convert the user-selected unit to a base unit for storage
    const { amount: baseQuantity, base: baseUnit } = toBase(
      data.packQuantity,
      data.packUnit as Unit,
      data.densityGPerMl ?? undefined
    );
    
    // Debug logging
    console.log('updateIngredient - Saving:', {
      packQuantity: data.packQuantity,
      packUnit: data.packUnit,
      baseQuantity,
      baseUnit,
      originalUnit: data.packUnit,
      batchPricing: data.batchPricing
    });
    
    // Convert batch pricing quantities to base units if provided
    // For bulk purchases, preserve purchaseUnit and unitSize
    let batchPricingInBase: any = null;
    console.log('updateIngredient - Processing batchPricing:', {
      exists: !!data.batchPricing,
      isArray: Array.isArray(data.batchPricing),
      length: Array.isArray(data.batchPricing) ? data.batchPricing.length : 'N/A',
      value: JSON.stringify(data.batchPricing)
    });
    if (data.batchPricing && Array.isArray(data.batchPricing) && data.batchPricing.length > 0) {
      batchPricingInBase = data.batchPricing.map(tier => {
        // If this is a bulk purchase (has purchaseUnit), preserve all fields
        if (tier.purchaseUnit) {
          const result = {
            packQuantity: tier.packQuantity, // Already in correct units (number of packs)
            packPrice: tier.packPrice,
            purchaseUnit: tier.purchaseUnit,
            unitSize: tier.unitSize, // Size per individual unit
          };
          console.log('updateIngredient - Mapping bulk tier:', JSON.stringify(result, null, 2));
          return result;
        }
        // Otherwise, convert to base units for regular batch pricing
        const { amount: tierBaseQty } = toBase(
          tier.packQuantity,
          data.packUnit as Unit,
          data.densityGPerMl ?? undefined
        );
        return {
          packQuantity: tierBaseQty,
          packPrice: tier.packPrice,
        };
      });
      console.log('updateIngredient - Saving batchPricing:', JSON.stringify(batchPricingInBase, null, 2));
    } else {
      console.log('updateIngredient - No batchPricing to save (null/empty):', data.batchPricing);
    }
    
    // Check if price changed
    const priceChanged = existingIngredient && Number(existingIngredient.packPrice) !== data.packPrice;
    
    // Check if pack quantity changed (for updating timestamp)
    const packQuantityChanged = existingIngredient && Number(existingIngredient.packQuantity) !== baseQuantity;
    
    const updateData = {
      name: data.name,
      supplier: data.supplier ?? null,
      supplierId: data.supplierId,
      packQuantity: baseQuantity,
      packUnit: baseUnit as BaseUnit,
      originalUnit: data.packUnit as Unit,
      packPrice: data.packPrice,
      currency: data.currency,
      densityGPerMl: (data.densityGPerMl as number | null) ?? null,
      allergens: data.allergens,
      batchPricing: batchPricingInBase,
      customConversions: data.customConversions ?? null,
      notes: data.notes ?? null,
      // Update lastPriceUpdate timestamp if price or pack quantity changed
      ...((priceChanged || packQuantityChanged) && { lastPriceUpdate: new Date() }),
    };
    
    console.log('updateIngredient - Prisma update data batchPricing:', JSON.stringify(updateData.batchPricing, null, 2));
    
    const updated = await prisma.ingredient.update({
      where: { id },
      data: updateData,
    });
    
    console.log('updateIngredient - After save, batchPricing in DB:', JSON.stringify(updated.batchPricing, null, 2));
    revalidatePath("/dashboard/ingredients");
    return { success: true };
  } catch (error) {
    console.error("Error updating ingredient:", error);
    throw new Error("Failed to update ingredient");
  }
}

export async function deleteIngredient(id: number) {
  // Verify the ingredient belongs to the user's company
  const { companyId, user } = await getCurrentUserAndCompany();
  
  const existingIngredient = await prisma.ingredient.findUnique({
    where: { id },
    select: { 
      companyId: true, 
      name: true,
      recipeItems: {
        select: {
          recipe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
  });
  
  // Security check: Verify ingredient belongs to user's company
  if (!existingIngredient || existingIngredient.companyId !== companyId) {
    throw new Error("Unauthorized: Cannot delete ingredient from another company");
  }
  
  // Check if ingredient is being used in any recipes
  if (existingIngredient.recipeItems && existingIngredient.recipeItems.length > 0) {
    const recipeNames = existingIngredient.recipeItems
      .map(item => item.recipe.name)
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .slice(0, 5); // Show max 5 recipes
    
    const recipeList = recipeNames.join(", ");
    const moreCount = existingIngredient.recipeItems.length - recipeNames.length;
    const moreText = moreCount > 0 ? ` and ${moreCount} more` : "";
    
    throw new Error(
      `Cannot delete "${existingIngredient.name}" because it's currently used in: ${recipeList}${moreText}. Please remove it from these recipes first.`
    );
  }
  
  await prisma.ingredient.delete({ where: { id } });
  
  // Audit deletion (non-blocking)
  if (user && companyId) {
    try {
      const { auditLog } = await import("@/lib/audit-log");
      await auditLog.ingredientDeleted(user.id, id, existingIngredient.name, companyId);
    } catch (auditError) {
      console.error("Audit log error (non-blocking):", auditError);
      // Don't fail the deletion if audit logging fails
    }
  }
  
  revalidatePath("/dashboard/ingredients");
}

export async function getSuppliers() {
  const { companyId } = await getCurrentUserAndCompany();
  
  const suppliersRaw = await prisma.supplier.findMany({
    where: { companyId },
    orderBy: { name: "asc" }
  });

  return suppliersRaw.map(supplier => ({
    ...supplier,
    minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
  }));
}

export async function confirmPriceUpdate(ingredientId: number) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    // Verify the ingredient belongs to the user's company
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { companyId: true },
    });
    
    if (!existingIngredient || existingIngredient.companyId !== companyId) {
      throw new Error("Unauthorized: Cannot update ingredient from another company");
    }
    
    // Update lastPriceUpdate to current date (price is still the same)
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        lastPriceUpdate: new Date(),
      },
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ingredients");
    return { success: true };
  } catch (error) {
    console.error("Error confirming price update:", error);
    throw new Error("Failed to confirm price update");
  }
}

export async function updateIngredientPrice(ingredientId: number, newPrice: number) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    
    // Verify the ingredient belongs to the user's company
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { companyId: true },
    });
    
    if (!existingIngredient || existingIngredient.companyId !== companyId) {
      throw new Error("Unauthorized: Cannot update ingredient from another company");
    }
    
    if (newPrice < 0) {
      throw new Error("Price cannot be negative");
    }
    
    // Update price and lastPriceUpdate
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        packPrice: newPrice,
        lastPriceUpdate: new Date(),
      },
    });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/ingredients");
    return { success: true };
  } catch (error) {
    console.error("Error updating ingredient price:", error);
    throw new Error("Failed to update ingredient price");
  }
}

export async function bulkDeleteIngredients(ids: number[]) {
  const { companyId, user } = await getCurrentUserAndCompany();
  
  // Verify all ingredients belong to the user's company and check for usage
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ids } },
    select: { 
      id: true, 
      companyId: true, 
      name: true,
      recipeItems: {
        select: {
          recipe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
  });
  
  const unauthorized = ingredients.filter(ing => ing.companyId !== companyId);
  if (unauthorized.length > 0) {
    throw new Error("Unauthorized: Cannot delete ingredients from another company");
  }
  
  // Check for ingredients used in recipes
  const usedIngredients = ingredients.filter(ing => ing.recipeItems && ing.recipeItems.length > 0);
  if (usedIngredients.length > 0) {
    const names = usedIngredients.map(ing => ing.name).join(", ");
    throw new Error(`Cannot delete ingredients used in recipes: ${names}. Please remove them from recipes first.`);
  }
  
  // Delete all ingredients
  await prisma.ingredient.deleteMany({
    where: { id: { in: ids }, companyId },
  });
  
  // Audit deletions
  if (user && companyId) {
    const { auditLog } = await import("@/lib/audit-log");
    for (const ingredient of ingredients) {
      try {
        await auditLog.ingredientDeleted(user.id, ingredient.id, ingredient.name, companyId);
      } catch (error) {
        console.error("Audit log error (non-blocking):", error);
      }
    }
  }
  
  revalidatePath("/dashboard/ingredients");
}

export async function bulkUpdateIngredients(ids: number[], updates: { supplierId?: number | null }) {
  const { companyId } = await getCurrentUserAndCompany();
  
  // Verify all ingredients belong to the user's company
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ids } },
    select: { id: true, companyId: true },
  });
  
  const unauthorized = ingredients.filter(ing => ing.companyId !== companyId);
  if (unauthorized.length > 0) {
    throw new Error("Unauthorized: Cannot update ingredients from another company");
  }
  
  // Prepare update data
  const updateData: any = {};
  if (updates.supplierId !== undefined) {
    updateData.supplierId = updates.supplierId;
  }
  
  // Update all ingredients
  await prisma.ingredient.updateMany({
    where: { id: { in: ids }, companyId },
    data: updateData,
  });
  
  revalidatePath("/dashboard/ingredients");
}


