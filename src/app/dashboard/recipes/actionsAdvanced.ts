"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";

const baseUnitEnum = z.enum(["g", "ml", "each"]);
const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon", "each"]);

const recipeSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  method: z.string().optional(),
  order: z.number().int().min(0),
  items: z.array(z.object({
    id: z.string(),
    ingredientId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: unitEnum,
    note: z.string().optional(),
  })),
});

const subRecipeSchema = z.object({
  id: z.string(),
  subRecipeId: z.number().int().positive(),
  quantity: z.number().positive(),
  unit: unitEnum,
  note: z.string().optional(),
});

const advancedRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  yieldQuantity: z.coerce.number().positive(),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  method: z.string().optional(),
  sections: z
    .string()
    .default("[]")
    .transform((s) => {
      try {
        return JSON.parse(s) as z.infer<typeof recipeSectionSchema>[];
      } catch {
        return [];
      }
    })
    .pipe(z.array(recipeSectionSchema)),
  subRecipes: z
    .string()
    .default("[]")
    .transform((s) => {
      try {
        return JSON.parse(s) as z.infer<typeof subRecipeSchema>[];
      } catch {
        return [];
      }
    })
    .pipe(z.array(subRecipeSchema)),
});

export async function createAdvancedRecipe(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = advancedRecipeSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    redirect("/recipes?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();

  await prisma.$transaction(async (tx) => {
    // Create the main recipe
    const recipe = await tx.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        imageUrl: data.imageUrl,
        method: data.method,
        companyId: companyId ?? undefined,
      },
    });

    // Create sections
    for (const sectionData of data.sections) {
      const section = await tx.recipeSection.create({
        data: {
          recipeId: recipe.id,
          title: sectionData.title,
          description: sectionData.description,
          method: sectionData.method,
          order: sectionData.order,
        },
      });

      // Create items for this section
      for (const itemData of sectionData.items) {
        await tx.recipeItem.create({
          data: {
            recipeId: recipe.id,
            sectionId: section.id,
            ingredientId: itemData.ingredientId,
            quantity: itemData.quantity,
            unit: itemData.unit,
            note: itemData.note,
          },
        });
      }
    }

    // Create sub-recipes
    for (const subRecipeData of data.subRecipes) {
      await tx.recipeSubRecipe.create({
        data: {
          parentRecipeId: recipe.id,
          subRecipeId: subRecipeData.subRecipeId,
          quantity: subRecipeData.quantity,
          unit: subRecipeData.unit,
          note: subRecipeData.note,
        },
      });
    }
  });

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateAdvancedRecipe(id: number, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = advancedRecipeSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten());
    redirect("/recipes?error=validation");
  }
  
  const data = parsed.data;
  
  // Verify the recipe belongs to the user's company
  const { companyId } = await getCurrentUserAndCompany();
  
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: { companyId: true },
  });
  
  // Security check: Verify recipe belongs to user's company
  if (!existingRecipe || existingRecipe.companyId !== companyId) {
    redirect("/recipes?error=unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    // Update the main recipe
    await tx.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        imageUrl: data.imageUrl,
        method: data.method,
      },
    });

    // Delete existing sections and their items
    await tx.recipeItem.deleteMany({ where: { recipeId: id } });
    await tx.recipeSection.deleteMany({ where: { recipeId: id } });
    await tx.recipeSubRecipe.deleteMany({ where: { parentRecipeId: id } });

    // Create new sections
    for (const sectionData of data.sections) {
      const section = await tx.recipeSection.create({
        data: {
          recipeId: id,
          title: sectionData.title,
          description: sectionData.description,
          method: sectionData.method,
          order: sectionData.order,
        },
      });

      // Create items for this section
      for (const itemData of sectionData.items) {
        await tx.recipeItem.create({
          data: {
            recipeId: id,
            sectionId: section.id,
            ingredientId: itemData.ingredientId,
            quantity: itemData.quantity,
            unit: itemData.unit,
            note: itemData.note,
          },
        });
      }
    }

    // Create new sub-recipes
    for (const subRecipeData of data.subRecipes) {
      await tx.recipeSubRecipe.create({
        data: {
          parentRecipeId: id,
          subRecipeId: subRecipeData.subRecipeId,
          quantity: subRecipeData.quantity,
          unit: subRecipeData.unit,
          note: subRecipeData.note,
        },
      });
    }
  });

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function deleteAdvancedRecipe(id: number) {
  // Verify the recipe belongs to the user's company
  const { companyId } = await getCurrentUserAndCompany();
  
  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: { companyId: true },
  });
  
  // Security check: Verify recipe belongs to user's company
  if (!existingRecipe || existingRecipe.companyId !== companyId) {
    throw new Error("Unauthorized: Cannot delete recipe from another company");
  }
  
  await prisma.recipe.delete({ where: { id } });
  revalidatePath("/recipes");
}
