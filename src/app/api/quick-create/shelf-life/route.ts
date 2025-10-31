"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { NextResponse } from "next/server";
import { z } from "zod";

const createShelfLifeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    
    const parsed = createShelfLifeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, description } = parsed.data;

    // Check if option already exists
    const existing = await prisma.shelfLifeOption.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Shelf life option already exists", option: existing },
        { status: 409 }
      );
    }

    // Get max order value
    const maxOrder = await prisma.shelfLifeOption.findFirst({
      where: { companyId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const option = await prisma.shelfLifeOption.create({
      data: {
        name,
        description: description || null,
        companyId,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Error creating shelf life option:", error);
    return NextResponse.json(
      { error: "Failed to create shelf life option" },
      { status: 500 }
    );
  }
}

