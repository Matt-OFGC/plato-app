"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const shelfLifeSchema = z.object({
  name: z.string().min(1, "Shelf life name is required").max(50, "Shelf life name must be less than 50 characters"),
  description: z.string().optional(),
});

export async function createShelfLifeOption(formData: FormData) {
  const parsed = shelfLifeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Shelf life validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.shelfLifeOption.create({
      data: {
        name: data.name,
        description: data.description || null,
        companyId,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=shelf_life_created");
  } catch (error) {
    console.error("Error creating shelf life option:", error);
    redirect("/account?error=shelf_life_exists");
  }
}

export async function updateShelfLifeOption(id: number, formData: FormData) {
  const parsed = shelfLifeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Shelf life validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.shelfLifeOption.update({
      where: { 
        id,
        companyId, // Ensure user can only update their own options
      },
      data: {
        name: data.name,
        description: data.description || null,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=shelf_life_updated");
  } catch (error) {
    console.error("Error updating shelf life option:", error);
    redirect("/account?error=update_failed");
  }
}

export async function deleteShelfLifeOption(id: number) {
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    // First, remove shelf life from any recipes that use it
    await prisma.recipe.updateMany({
      where: { 
        shelfLifeId: id,
        companyId,
      },
      data: {
        shelfLifeId: null,
      },
    });
    
    // Then delete the shelf life option
    await prisma.shelfLifeOption.delete({
      where: { 
        id,
        companyId, // Ensure user can only delete their own options
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=shelf_life_deleted");
  } catch (error) {
    console.error("Error deleting shelf life option:", error);
    redirect("/account?error=delete_failed");
  }
}
