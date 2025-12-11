import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logger } from "@/lib/logger";

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  description: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supplierId = parseInt(id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
    }

    const formData = await request.formData();
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
      include: {
        _count: {
          select: { ingredients: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      supplier: {
        ...supplier,
        minimumOrder: supplier.minimumOrder ? Number(supplier.minimumOrder) : null,
      }
    });
  } catch (error) {
    logger.error("Error updating supplier", error, "Suppliers");
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, companyId } = await getCurrentUserAndCompany();
    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supplierId = parseInt(id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: "Invalid supplier ID" }, { status: 400 });
    }

    // Check if supplier has ingredients
    const ingredientCount = await prisma.ingredient.count({
      where: { supplierId: supplierId }
    });

    if (ingredientCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete supplier. It is used by ${ingredientCount} ingredient${ingredientCount !== 1 ? 's' : ''}.` 
      }, { status: 400 });
    }

    await prisma.supplier.delete({
      where: { id: supplierId, companyId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting supplier", error, "Suppliers");
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
