"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  description: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  deliveryDays: z.array(z.string()).optional(),
  deliveryNotes: z.string().optional(),
  accountLogin: z.string().optional(),
  accountPassword: z.string().optional(),
  accountNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  paymentTerms: z.string().optional(),
  minimumOrder: z.string().optional().transform((val) => val ? parseFloat(val) : null),
});

export async function createSupplier(formData: FormData) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      website: formData.get("website") as string,
      deliveryDays: formData.get("deliveryDays") ? JSON.parse(formData.get("deliveryDays") as string) : [],
      deliveryNotes: formData.get("deliveryNotes") as string,
      accountLogin: formData.get("accountLogin") as string,
      accountPassword: formData.get("accountPassword") as string,
      accountNumber: formData.get("accountNumber") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      postcode: formData.get("postcode") as string,
      country: formData.get("country") as string,
      currency: formData.get("currency") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      minimumOrder: formData.get("minimumOrder") as string,
    };

    const validatedData = supplierSchema.parse(data);

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        companyId,
      },
    });

    return { success: true, supplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return { success: false, error: "Failed to create supplier" };
  }
}

export async function updateSupplier(id: number, formData: FormData) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      website: formData.get("website") as string,
      deliveryDays: formData.get("deliveryDays") ? JSON.parse(formData.get("deliveryDays") as string) : [],
      deliveryNotes: formData.get("deliveryNotes") as string,
      accountLogin: formData.get("accountLogin") as string,
      accountPassword: formData.get("accountPassword") as string,
      accountNumber: formData.get("accountNumber") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      postcode: formData.get("postcode") as string,
      country: formData.get("country") as string,
      currency: formData.get("currency") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      minimumOrder: formData.get("minimumOrder") as string,
    };

    const validatedData = supplierSchema.parse(data);

    const supplier = await prisma.supplier.update({
      where: { id, companyId },
      data: validatedData,
    });

    return { success: true, supplier };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Failed to update supplier" };
  }
}

export async function deleteSupplier(id: number) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.supplier.delete({
      where: { id, companyId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Failed to delete supplier" };
  }
}
