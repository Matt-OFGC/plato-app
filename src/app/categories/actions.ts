"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
  description: z.string().optional(),
  color: z.string().optional(),
});

export async function createCategory(formData: FormData) {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Category validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
        color: data.color || null,
        companyId,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=category_created");
  } catch (error) {
    console.error("Error creating category:", error);
    redirect("/account?error=category_exists");
  }
}

export async function updateCategory(id: number, formData: FormData) {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Category validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.category.update({
      where: { 
        id,
        companyId, // Ensure user can only update their own categories
      },
      data: {
        name: data.name,
        description: data.description || null,
        color: data.color || null,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=category_updated");
  } catch (error) {
    console.error("Error updating category:", error);
    redirect("/account?error=update_failed");
  }
}

export async function deleteCategory(id: number) {
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    // First, remove category from any recipes that use it
    await prisma.recipe.updateMany({
      where: { 
        categoryId: id,
        companyId,
      },
      data: {
        categoryId: null,
      },
    });
    
    // Then delete the category
    await prisma.category.delete({
      where: { 
        id,
        companyId, // Ensure user can only delete their own categories
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=category_deleted");
  } catch (error) {
    console.error("Error deleting category:", error);
    redirect("/account?error=delete_failed");
  }
}
