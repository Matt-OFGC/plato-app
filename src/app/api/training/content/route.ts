import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Get training content for a module
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

    if (!moduleId) {
      return NextResponse.json(
        { error: "Module ID required" },
        { status: 400 }
      );
    }

    // Verify module belongs to company
    const module = await prisma.trainingModule.findUnique({
      where: { id: parseInt(moduleId) },
      select: { companyId: true },
    });

    if (!module || module.companyId !== companyId) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    const content = await prisma.trainingContent.findMany({
      where: { moduleId: parseInt(moduleId) },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ content });
  } catch (error) {
    logger.error("Get training content error", error, "Training/Content");
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// Create training content
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check permission - allow ADMIN and OWNER for MVP
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return NextResponse.json(
        { error: "No permission to edit training" },
        { status: 403 }
      );
    }

    // ADMIN and OWNER can edit, others need explicit permission check
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      const canEdit = await checkPermission(
        session.id,
        companyId,
        "training:edit"
      );
      if (!canEdit) {
        return NextResponse.json(
          { error: "No permission to edit training" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { moduleId, type, content, order, metadata } = body;

    if (!moduleId || !type) {
      return NextResponse.json(
        { error: "Module ID and type required" },
        { status: 400 }
      );
    }

    // Verify module belongs to company
    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      select: { companyId: true },
    });

    if (!module || module.companyId !== companyId) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    const contentItem = await prisma.trainingContent.create({
      data: {
        moduleId,
        type,
        content,
        order: order || 0,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ content: contentItem }, { status: 201 });
  } catch (error) {
    logger.error("Create training content error", error, "Training/Content");
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}

