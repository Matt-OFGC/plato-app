import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Update training content
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

    // Check permission
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

    const { id } = await params;
    const contentId = parseInt(id);

    if (isNaN(contentId)) {
      return NextResponse.json({ error: "Invalid content ID" }, { status: 400 });
    }

    const body = await request.json();
    const { type, content, order, metadata } = body;

    // Verify content belongs to company
    const existingContent = await prisma.trainingContent.findUnique({
      where: { id: contentId },
      include: {
        module: {
          select: { companyId: true },
        },
      },
    });

    if (!existingContent || existingContent.module.companyId !== companyId) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const contentItem = await prisma.trainingContent.update({
      where: { id: contentId },
      data: {
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(order !== undefined && { order }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    return NextResponse.json({ content: contentItem });
  } catch (error) {
    console.error("Update training content error:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

// Delete training content
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

    // Check permission
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

    const { id } = await params;
    const contentId = parseInt(id);

    if (isNaN(contentId)) {
      return NextResponse.json({ error: "Invalid content ID" }, { status: 400 });
    }

    // Verify content belongs to company
    const existingContent = await prisma.trainingContent.findUnique({
      where: { id: contentId },
      include: {
        module: {
          select: { companyId: true },
        },
      },
    });

    if (!existingContent || existingContent.module.companyId !== companyId) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    await prisma.trainingContent.delete({
      where: { id: contentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete training content error:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

