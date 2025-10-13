"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";
import { toBase, BaseUnit, Unit } from "@/lib/units";

const baseUnitEnum = z.enum(["g", "ml", "each", "slices"]);
const unitEnum = z.enum(["g", "kg", "mg", "lb", "oz", "ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon", "each", "slices"]);

const recipeSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  method: z.string().optional(),
  order: z.number(),
  items: z.array(z.object({
    id: z.string(),
    ingredientId: z.number().int().positive(),
    quantity: z.number().positive(),
    unit: unitEnum,
    note: z.string().optional(),
  })),
});

const recipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  yieldQuantity: z.coerce.number().positive(),
  yieldUnit: baseUnitEnum,
  imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  method: z.string().optional(),
  isSubRecipe: z.string().transform((v) => v === "true"),
  bakeTime: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  bakeTemp: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  storage: z.string().optional().transform((v) => v === "" ? null : v),
  shelfLife: z.string().optional().transform((v) => v === "" ? null : v),
  category: z.string().optional().transform((v) => v === "" ? null : v),
  categoryId: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  shelfLifeId: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  storageId: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  sellingPrice: z.string().optional().transform((v) => v === "" ? null : (v ? parseFloat(v) : null)),
  portionsPerBatch: z.string().optional().transform((v) => v === "" ? null : (v ? parseInt(v) : null)),
  sections: z
    .string()
    .default("[]")
    .transform((s) => {
      try {
        return JSON.parse(s as string) as Array<z.infer<typeof recipeSectionSchema>>;
      } catch {
        return [] as any[];
      }
    })
    .pipe(z.array(recipeSectionSchema)),
  subRecipes: z
    .string()
    .default("[]")
    .transform((s) => {
      try {
        return JSON.parse(s as string) as Array<{
          id: string;
          subRecipeId: number;
          quantity: number;
          unit: z.infer<typeof unitEnum>;
          note?: string;
        }>;
      } catch {
        return [] as any[];
      }
    }),
});

export async function createRecipeWithSections(formData: FormData) {
  const parsed = recipeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
    redirect("/recipes?error=validation");
  }

  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();

  try {
    // Check if recipe with this name already exists for this company
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        name: data.name,
        companyId: companyId ?? null,
      },
    });

    if (existingRecipe) {
      redirect(`/recipes/new?error=duplicate_name&name=${encodeURIComponent(data.name)}`);
    }

    // Create the recipe
    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        imageUrl: data.imageUrl,
        method: data.method,
        isSubRecipe: data.isSubRecipe,
        bakeTime: data.bakeTime,
        bakeTemp: data.bakeTemp,
        storage: data.storage,
        shelfLife: data.shelfLife,
        category: data.category,
        categoryId: data.categoryId,
        shelfLifeId: data.shelfLifeId,
        storageId: data.storageId,
        sellingPrice: data.sellingPrice,
        portionsPerBatch: data.portionsPerBatch,
        companyId: companyId ?? undefined,
      },
    });

    // Create sections and items
    if (data.sections.length > 0) {
      // Create sections
      for (const sectionData of data.sections) {
        const section = await prisma.recipeSection.create({
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
          // Convert the unit to base unit for storage
          const { amount: baseQuantity, base: baseUnit } = toBase(
            itemData.quantity,
            itemData.unit as Unit
          );

          await prisma.recipeItem.create({
            data: {
              recipeId: recipe.id,
              sectionId: section.id,
              ingredientId: itemData.ingredientId,
              quantity: baseQuantity,
              unit: baseUnit as BaseUnit,
              note: itemData.note,
            },
          });
        }
      }
    } else {
      // Handle non-sectioned recipes - create items directly on the recipe
      // We need to get the items from the form data
      const itemsData = formData.get("items");
      if (itemsData && typeof itemsData === "string") {
        try {
          const items = JSON.parse(itemsData);
          for (const itemData of items) {
            // Convert the unit to base unit for storage
            const { amount: baseQuantity, base: baseUnit } = toBase(
              itemData.quantity,
              itemData.unit as Unit
            );

            await prisma.recipeItem.create({
              data: {
                recipeId: recipe.id,
                ingredientId: itemData.ingredientId,
                quantity: baseQuantity,
                unit: baseUnit as BaseUnit,
                note: itemData.note,
              },
            });
          }
        } catch (error) {
          console.error("Error parsing items:", error);
        }
      }
    }

    // Create sub-recipes
    for (const subRecipeData of data.subRecipes) {
      await prisma.recipeSubRecipe.create({
        data: {
          parentRecipeId: recipe.id,
          subRecipeId: subRecipeData.subRecipeId,
          quantity: subRecipeData.quantity,
          unit: subRecipeData.unit as Unit,
          note: subRecipeData.note,
        },
      });
    }

    revalidatePath("/recipes");
    redirect("/recipes");
  } catch (error) {
    console.error("Error creating recipe:", error);
    // Check if it's a unique constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      redirect("/recipes/new?error=duplicate_name");
    }
    redirect("/recipes?error=creation");
  }
}

export async function updateRecipeWithSections(id: number, formData: FormData) {
  const parsed = recipeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Validation error:", parsed.error);
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

  try {
    // Update the recipe
    await prisma.recipe.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        yieldQuantity: data.yieldQuantity,
        yieldUnit: data.yieldUnit,
        imageUrl: data.imageUrl,
        method: data.method,
        isSubRecipe: data.isSubRecipe,
        bakeTime: data.bakeTime,
        bakeTemp: data.bakeTemp,
        storage: data.storage,
        shelfLife: data.shelfLife,
        category: data.category,
        categoryId: data.categoryId,
        shelfLifeId: data.shelfLifeId,
        storageId: data.storageId,
        sellingPrice: data.sellingPrice,
        portionsPerBatch: data.portionsPerBatch,
      },
    });

    // Delete existing sections and items
    await prisma.recipeItem.deleteMany({ where: { recipeId: id } });
    await prisma.recipeSection.deleteMany({ where: { recipeId: id } });
    await prisma.recipeSubRecipe.deleteMany({ where: { parentRecipeId: id } });

    // Recreate sections
    for (const sectionData of data.sections) {
      const section = await prisma.recipeSection.create({
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
        // Convert the unit to base unit for storage
        const { amount: baseQuantity, base: baseUnit } = toBase(
          itemData.quantity,
          itemData.unit as Unit
        );

        await prisma.recipeItem.create({
          data: {
            recipeId: id,
            sectionId: section.id,
            ingredientId: itemData.ingredientId,
            quantity: baseQuantity,
            unit: baseUnit as BaseUnit,
            note: itemData.note,
          },
        });
      }
    }

    // Recreate sub-recipes
    for (const subRecipeData of data.subRecipes) {
      await prisma.recipeSubRecipe.create({
        data: {
          parentRecipeId: id,
          subRecipeId: subRecipeData.subRecipeId,
          quantity: subRecipeData.quantity,
          unit: subRecipeData.unit as Unit,
          note: subRecipeData.note,
        },
      });
    }

    revalidatePath("/recipes");
    redirect("/recipes");
  } catch (error) {
    console.error("Error updating recipe:", error);
    redirect("/recipes?error=update");
  }
}
