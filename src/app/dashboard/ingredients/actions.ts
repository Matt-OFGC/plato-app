"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserAndCompany } from "@/lib/current";
import { toBase, BaseUnit, Unit } from "@/lib/units";
import { canAddIngredient, updateIngredientCount } from "@/lib/subscription";

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
      customConversions: data.customConversions ?? null,
      notes: data.notes ?? null,
      companyId: companyId ?? undefined,
    };
    
        await prisma.ingredient.create({
          data: ingredientData,
        });
        
        // Update user's ingredient count
        if (userId) {
          await updateIngredientCount(userId, 1);
        }
        
        revalidatePath("/dashboard/ingredients");
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
  const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Ingredient validation error:", parsed.error);
    redirect("/dashboard/ingredients?error=validation");
  }
  const data = parsed.data;
  
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
      redirect("/dashboard/ingredients?error=unauthorized");
    }
    
    // Convert the user-selected unit to a base unit for storage
    const { amount: baseQuantity, base: baseUnit } = toBase(
      data.packQuantity,
      data.packUnit as Unit,
      data.densityGPerMl ?? undefined
    );
    
    // Check if price changed
    const priceChanged = existingIngredient && Number(existingIngredient.packPrice) !== data.packPrice;
    
    await prisma.ingredient.update({
      where: { id },
      data: {
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
        customConversions: data.customConversions ?? null,
        notes: data.notes ?? null,
        // Update lastPriceUpdate timestamp if price changed
        ...(priceChanged && { lastPriceUpdate: new Date() }),
      },
    });
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


