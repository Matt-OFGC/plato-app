import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Get training module by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        content: {
          orderBy: { order: "asc" },
        },
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!module || module.companyId !== companyId) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // Check permission
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

    return NextResponse.json({ module });
  } catch (error) {
    logger.error("Get training module error", error, "Training/Modules");
    return NextResponse.json(
      { error: "Failed to fetch training module" },
      { status: 500 }
    );
  }
}

// Update training module
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    // Check permission
    const canEdit = await checkPermission(
      session.id,
      companyId,
      "training:edit"
    );
    if (!canEdit) {
      return NextResponse.json(
        { error: "No permission to edit training modules" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      estimatedDuration,
      refreshFrequencyDays,
      recipeIds,
    } = body;

    // Update module
    const module = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(estimatedDuration !== undefined && { estimatedDuration }),
        ...(refreshFrequencyDays !== undefined && { refreshFrequencyDays }),
      },
    });

    // Update recipe links if provided
    if (recipeIds !== undefined) {
      // Delete existing links
      await prisma.trainingModuleRecipe.deleteMany({
        where: { moduleId },
      });

      // Create new links
      if (recipeIds.length > 0) {
        await prisma.trainingModuleRecipe.createMany({
          data: recipeIds.map((recipeId: number) => ({
            moduleId,
            recipeId,
          })),
        });
      }
    }

    // Fetch updated module with relations
    const updatedModule = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        content: {
          orderBy: { order: "asc" },
        },
        recipes: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    logger.error("Update training module error", error, "Training/Modules");
    return NextResponse.json(
      { error: "Failed to update training module" },
      { status: 500 }
    );
  }
}

// Delete training module
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const moduleId = parseInt(id);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
    }

    // Check permission
    const canDelete = await checkPermission(
      session.id,
      companyId,
      "training:delete"
    );
    if (!canDelete) {
      return NextResponse.json(
        { error: "No permission to delete training modules" },
        { status: 403 }
      );
    }

    await prisma.trainingModule.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete training module error", error, "Training/Modules");
    return NextResponse.json(
      { error: "Failed to delete training module" },
      { status: 500 }
    );
  }
}

