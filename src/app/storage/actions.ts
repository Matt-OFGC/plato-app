"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const storageSchema = z.object({
  name: z.string().min(1, "Storage name is required").max(50, "Storage name must be less than 50 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export async function createStorageOption(formData: FormData) {
  const parsed = storageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Storage validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.storageOption.create({
      data: {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        companyId,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=storage_created");
  } catch (error) {
    console.error("Error creating storage option:", error);
    redirect("/account?error=storage_exists");
  }
}

export async function updateStorageOption(id: number, formData: FormData) {
  const parsed = storageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    console.error("Storage validation error:", parsed.error);
    redirect("/account?error=validation");
  }
  
  const data = parsed.data;
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    await prisma.storageOption.update({
      where: { 
        id,
        companyId, // Ensure user can only update their own options
      },
      data: {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=storage_updated");
  } catch (error) {
    console.error("Error updating storage option:", error);
    redirect("/account?error=update_failed");
  }
}

export async function deleteStorageOption(id: number) {
  const { companyId } = await getCurrentUserAndCompany();
  
  try {
    // First, remove storage from any recipes that use it
    await prisma.recipe.updateMany({
      where: { 
        storageId: id,
        companyId,
      },
      data: {
        storageId: null,
      },
    });
    
    // Then delete the storage option
    await prisma.storageOption.delete({
      where: { 
        id,
        companyId, // Ensure user can only delete their own options
      },
    });
    
    revalidatePath("/account");
    redirect("/account?success=storage_deleted");
  } catch (error) {
    console.error("Error deleting storage option:", error);
    redirect("/account?error=delete_failed");
  }
}

