"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { NextResponse } from "next/server";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, description, color } = parsed.data;

    // Check if category already exists
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category already exists", category: existing },
        { status: 409 }
      );
    }

    // Get max order value
    const maxOrder = await prisma.category.findFirst({
      where: { companyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const category = await prisma.category.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        companyId,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

