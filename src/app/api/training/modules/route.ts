import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Debug: Verify prisma has trainingModule
if (!prisma.trainingModule) {
  logger.error("Prisma client missing trainingModule!", {}, "Training/Modules");
  console.error("Available prisma methods:", Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
}

// Get all training modules for a company
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
        { error: "No permission to view training" },
        { status: 403 }
      );
    }

    // ADMIN and OWNER can view, others need explicit permission check
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      const canView = await checkPermission(
        session.id,
        companyId,
        "training:view"
      );
      if (!canView) {
        return NextResponse.json(
          { error: "No permission to view training" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const isTemplate = searchParams.get("isTemplate");

    const modules = await prisma.trainingModule.findMany({
      where: {
        companyId,
        ...(isTemplate !== null && { isTemplate: isTemplate === "true" }),
      },
      include: {
        content: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ modules });
  } catch (error) {
    logger.error("Get training modules error", error, "Training/Modules");
    return NextResponse.json(
      { error: "Failed to fetch training modules" },
      { status: 500 }
    );
  }
}

// Create a training module
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
        { error: "No permission to create training modules" },
        { status: 403 }
      );
    }

    // ADMIN and OWNER can create, others need explicit permission check
    if (membership.role !== "ADMIN" && membership.role !== "OWNER") {
      const canCreate = await checkPermission(
        session.id,
        companyId,
        "training:create"
      );
      if (!canCreate) {
        return NextResponse.json(
          { error: "No permission to create training modules" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      isTemplate,
      estimatedDuration,
      refreshFrequencyDays,
      content,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title required" },
        { status: 400 }
      );
    }

    // Create the module first
    const module = await prisma.trainingModule.create({
      data: {
        companyId,
        title,
        description: description || null,
        category: category || null,
        isTemplate: isTemplate || false,
        estimatedDuration: estimatedDuration || null,
        refreshFrequencyDays: refreshFrequencyDays || null,
        createdBy: session.id,
      },
    });

    // Create content items separately if provided
    if (content && content.length > 0) {
      await prisma.trainingContent.createMany({
        data: content.map((item: any, index: number) => ({
          moduleId: module.id,
          type: item.type,
          content: item.content || "",
          order: item.order ?? index,
          metadata: item.metadata || {},
        })),
      });
    }

    // Fetch the complete module with content
    const moduleWithContent = await prisma.trainingModule.findUnique({
      where: { id: module.id },
      include: {
        content: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ module: moduleWithContent }, { status: 201 });
  } catch (error) {
    logger.error("Create training module error", error, "Training/Modules");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to create training module: ${errorMessage}` },
      { status: 500 }
    );
  }
}

