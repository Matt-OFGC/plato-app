"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserAndCompany } from "@/lib/current";
import { toBase, BaseUnit, Unit } from "@/lib/units";

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
    console.log("Starting createIngredient with formData:", Object.fromEntries(formData));
    
    const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      redirect("/ingredients?error=validation");
    }

    const data = parsed.data;
    console.log("Parsed data:", data);
    
    const { companyId } = await getCurrentUserAndCompany();
    console.log("Company ID:", companyId);
    
    // Convert the user-selected unit to a base unit for storage
    const { amount: baseQuantity, base: baseUnit } = toBase(
      data.packQuantity,
      data.packUnit as Unit,
      data.densityGPerMl ?? undefined
    );
    console.log("Unit conversion result:", { baseQuantity, baseUnit });
    
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
    console.log("Ingredient data to create:", ingredientData);
    
    await prisma.ingredient.create({
      data: ingredientData,
    });
    console.log("Ingredient created successfully");
    
    revalidatePath("/ingredients");
    redirect("/ingredients");
  } catch (error) {
    console.error("Error in createIngredient:", error);
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
    // Convert the user-selected unit to a base unit for storage
    const { amount: baseQuantity, base: baseUnit } = toBase(
      data.packQuantity,
      data.packUnit as Unit,
      data.densityGPerMl ?? undefined
    );
    
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
      },
    });
    revalidatePath("/ingredients");
    redirect("/ingredients");
  } catch (error) {
    console.error("Error updating ingredient:", error);
    redirect("/ingredients?error=update_failed");
  }
}

export async function deleteIngredient(id: number) {
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/ingredients");
}


