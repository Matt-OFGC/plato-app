import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createStorageSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    
    const parsed = createStorageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, description, icon } = parsed.data;

    // Check if option already exists
    const existing = await prisma.storageOption.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Storage option already exists", option: existing },
        { status: 409 }
      );
    }

    // Get max order value
    const maxOrder = await prisma.storageOption.findFirst({
      where: { companyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const option = await prisma.storageOption.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        companyId,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    logger.error("Error creating storage option", error, "QuickCreate/Storage");
    return NextResponse.json(
      { error: "Failed to create storage option" },
      { status: 500 }
    );
  }
}



