"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserAndCompany } from "@/lib/current";
import { toBase, BaseUnit, Unit } from "@/lib/units";
import { canAddIngredient, updateIngredientCount } from "@/lib/subscription";

const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon", "each", "slices"]);
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
  notes: z.string().optional().nullable(),
});

export async function createIngredient(formData: FormData) {
  try {
    const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      redirect("/ingredients?error=validation");
    }

    const data = parsed.data;
    const { companyId, user } = await getCurrentUserAndCompany();
    const userId = user?.id;
    
    // Check subscription limits
    if (userId && !(await canAddIngredient(userId))) {
      redirect("/ingredients?error=limit_reached&type=ingredient");
    }
    
    // Check if ingredient with this name already exists for this company
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        name: data.name,
        companyId: companyId ?? null,
      },
    });

    if (existingIngredient) {
      redirect(`/ingredients/new?error=duplicate_name&name=${encodeURIComponent(data.name)}`);
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
        
        revalidatePath("/ingredients");
        redirect("/ingredients");
  } catch (error) {
    console.error("Error in createIngredient:", error);
    // Check if it's a unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      redirect("/ingredients/new?error=duplicate_name");
    }
    redirect("/ingredients?error=server_error");
  }
}

export async function updateIngredient(id: number, formData: FormData) {
  const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Ingredient validation error:", parsed.error);
    redirect("/ingredients?error=validation");
  }
  const data = parsed.data;
  
  try {
    // Get existing ingredient to check if price changed
    const existingIngredient = await prisma.ingredient.findUnique({
      where: { id },
      select: { packPrice: true },
    });
    
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
        notes: data.notes ?? null,
        // Update lastPriceUpdate timestamp if price changed
        ...(priceChanged && { lastPriceUpdate: new Date() }),
      },
    });
    revalidatePath("/ingredients");
    redirect("/dashboard/ingredients");
  } catch (error) {
    console.error("Error updating ingredient:", error);
    redirect("/dashboard/ingredients?error=update_failed");
  }
}

export async function deleteIngredient(id: number) {
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/ingredients");
}


