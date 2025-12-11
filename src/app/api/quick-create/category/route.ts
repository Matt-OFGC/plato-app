import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    logger.debug("Category creation API called", null, "QuickCreate/Category");
    const { companyId } = await getCurrentUserAndCompany();
    logger.debug("Company ID", { companyId }, "QuickCreate/Category");
    const body = await request.json();
    logger.debug("Request body", body, "QuickCreate/Category");
    
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      logger.warn("Validation failed", { error: parsed.error }, "QuickCreate/Category");
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, description, color } = parsed.data;
    logger.debug("Creating category", { name, description, color, companyId }, "QuickCreate/Category");

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

    logger.info("Category created successfully", { categoryId: category.id, name }, "QuickCreate/Category");
    return NextResponse.json({ success: true, category });
  } catch (error) {
    logger.error("Error creating category", error, "QuickCreate/Category");
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}



