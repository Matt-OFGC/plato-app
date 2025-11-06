"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { canAddRecipe, updateRecipeCount } from "@/lib/subscription";
import { isRecipesTrial } from "@/lib/features";
import { z } from "zod";

const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);
const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "each", "slices", "pinch", "dash", "large", "medium", "small"]);

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
  const { companyId, user } = await getCurrentUserAndCompany();
  const userId = user?.id;

  // Check Recipes trial limits
  if (userId) {
    const isTrial = await isRecipesTrial(userId);
    if (isTrial && !(await canAddRecipe(userId))) {
      return { 
        ok: false as const, 
        error: { 
          formErrors: ["Recipe limit reached (5 recipes max on trial). Upgrade to Recipes Pro (£10/month) for unlimited recipes."], 
          fieldErrors: {} 
        } 
      };
    }
  }

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

  // Update user's recipe count
  if (userId) {
    await updateRecipeCount(userId);
  }

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

export async function bulkDeleteRecipes(ids: number[]) {
  const { companyId, user } = await getCurrentUserAndCompany();
  
  // Verify all recipes belong to the user's company
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: ids } },
    select: { id: true, companyId: true, name: true },
  });
  
  const unauthorized = recipes.filter(r => r.companyId !== companyId);
  if (unauthorized.length > 0) {
    throw new Error("Unauthorized: Cannot delete recipes from another company");
  }
  
  // Delete all recipes
  await prisma.recipe.deleteMany({
    where: { id: { in: ids }, companyId },
  });
  
  // Audit deletions
  if (user && companyId) {
    const { auditLog } = await import("@/lib/audit-log");
    for (const recipe of recipes) {
      try {
        await auditLog.recipeDeleted(user.id, recipe.id, recipe.name, companyId);
      } catch (error) {
        console.error("Audit log error (non-blocking):", error);
      }
    }
  }
  
  revalidatePath("/dashboard/recipes");
}

export async function bulkUpdateRecipes(ids: number[], updates: { categoryId?: number | null }) {
  const { companyId } = await getCurrentUserAndCompany();
  
  // Verify all recipes belong to the user's company
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: ids } },
    select: { id: true, companyId: true },
  });
  
  const unauthorized = recipes.filter(r => r.companyId !== companyId);
  if (unauthorized.length > 0) {
    throw new Error("Unauthorized: Cannot update recipes from another company");
  }
  
  // Prepare update data
  const updateData: any = {};
  if (updates.categoryId !== undefined) {
    updateData.categoryId = updates.categoryId;
  }
  
  // Update all recipes
  await prisma.recipe.updateMany({
    where: { id: { in: ids }, companyId },
    data: updateData,
  });
  
  revalidatePath("/dashboard/recipes");
}


