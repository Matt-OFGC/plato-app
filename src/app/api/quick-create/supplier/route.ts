"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSupplierSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name } = parsed.data;

    // Check if supplier already exists
    const existing = await prisma.supplier.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Supplier already exists", supplier: existing },
        { status: 409 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        companyId,
        deliveryDays: [],
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}

