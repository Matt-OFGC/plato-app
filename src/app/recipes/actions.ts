"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";

const baseUnitEnum = z.enum(["g", "ml", "each"]);
const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "each"]);

const recipeSchema = z.object({
  name: z.string().min(1),
  yieldQuantity: z.coerce.number().positive(),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  items: z
    .string()
    .transform((s) => {
      try {
        return JSON.parse(s as string) as Array<{ ingredientId: number; quantity: number; unit: z.infer<typeof unitEnum> }>;
      } catch {
        return [] as any[];
      }
    })
    .pipe(
      z
        .array(
          z.object({
            ingredientId: z.number().int().positive(),
            quantity: z.number().positive(),
            unit: unitEnum,
          })
        )
        .default([])
    ),
});

export async function createRecipe(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();

  await prisma.recipe.create({
    data: {
      name: data.name,
      yieldQuantity: data.yieldQuantity,
      yieldUnit: data.yieldUnit,
      imageUrl: data.imageUrl,
      companyId: companyId ?? undefined,
      items: {
        create: data.items.map((it) => ({ ingredientId: it.ingredientId, quantity: it.quantity, unit: it.unit })),
      },
    },
  });
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(id: number, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = recipeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };
  const data = parsed.data;

  // Replace items for simplicity
  await prisma.$transaction([
    prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        imageUrl: data.imageUrl,
      },
    }),
    prisma.recipeItem.deleteMany({ where: { recipeId: id } }),
    prisma.recipeItem.createMany({
      data: data.items.map((it) => ({ recipeId: id, ingredientId: it.ingredientId, quantity: it.quantity, unit: it.unit })),
    }),
  ]);
  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteRecipe(id: number) {
  await prisma.recipe.delete({ where: { id } });
  revalidatePath("/recipes");
}


