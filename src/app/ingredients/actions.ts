"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUserAndCompany } from "@/lib/current";

const baseUnitEnum = z.enum(["g", "ml", "each"]);

const ingredientSchema = z.object({
  name: z.string().min(1),
  supplier: z.string().optional().nullable(),
  packQuantity: z.coerce.number().positive(),
  packUnit: baseUnitEnum,
  packPrice: z.coerce.number().nonnegative(),
  currency: z.string().min(1).default("USD"),
  densityGPerMl: z
    .union([z.coerce.number().positive().nullable(), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v ?? null)),
  notes: z.string().optional().nullable(),
});

export async function createIngredient(formData: FormData) {
  const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  await prisma.ingredient.create({
    data: {
      name: data.name,
      supplier: data.supplier ?? null,
      packQuantity: data.packQuantity,
      packUnit: data.packUnit,
      packPrice: data.packPrice,
      currency: data.currency,
      densityGPerMl: (data.densityGPerMl as number | null) ?? null,
      notes: data.notes ?? null,
      companyId: companyId ?? undefined,
    },
  });
  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function updateIngredient(id: number, formData: FormData) {
  const parsed = ingredientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }
  const data = parsed.data;
  await prisma.ingredient.update({
    where: { id },
    data: {
      name: data.name,
      supplier: data.supplier ?? null,
      packQuantity: data.packQuantity,
      packUnit: data.packUnit,
      packPrice: data.packPrice,
      currency: data.currency,
      densityGPerMl: (data.densityGPerMl as number | null) ?? null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function deleteIngredient(id: number) {
  await prisma.ingredient.delete({ where: { id } });
  revalidatePath("/ingredients");
}


