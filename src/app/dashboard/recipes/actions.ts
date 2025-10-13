"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";

const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);
const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "each", "slices"]);

const recipeSchema = z.object({
  name: z.string().min(1),
  yieldQuantity: z.coerce.number().positive(),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  items: z
    .string()
    .default("[]")
    .transform((s) => {
      try {
        return JSON.parse(s as string) as Array<{ ingredientId: number; quantity: number; unit: z.infer<typeof unitEnum> }>;
      } catch {
        return [] as any[];
      }
    })
    .pipe(
      z.array(
        z.object({
          ingredientId: z.number().int().positive(),
          quantity: z.number().positive(),
          unit: unitEnum,
        })
      )
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

  // Verify the recipe belongs to the user's company
  const { companyId } = await getCurrentUserAndCompany();
  
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: { companyId: true },
  });
  
  // Security check: Verify recipe belongs to user's company
  if (!existingRecipe || existingRecipe.companyId !== companyId) {
    return { ok: false as const, error: { formErrors: ["Unauthorized"], fieldErrors: {} } };
  }

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
  // Verify the recipe belongs to the user's company
  const { companyId, user } = await getCurrentUserAndCompany();
  
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: { companyId: true, name: true },
  });
  
  // Security check: Verify recipe belongs to user's company
  if (!existingRecipe || existingRecipe.companyId !== companyId) {
    throw new Error("Unauthorized: Cannot delete recipe from another company");
  }
  
  await prisma.recipe.delete({ where: { id } });
  
  // Audit deletion
  if (user && companyId) {
    const { auditLog } = await import("@/lib/audit-log");
    await auditLog.recipeDeleted(user.id, id, existingRecipe.name, companyId);
  }
  
  revalidatePath("/recipes");
}


