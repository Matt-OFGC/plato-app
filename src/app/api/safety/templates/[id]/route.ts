import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    const template = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskTemplate"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (template.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const items = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemplateChecklistItem"
      WHERE "templateId" = ${parseInt(id)}
      ORDER BY "itemOrder" ASC
    `;

    return NextResponse.json({ ...template[0], checklistItems: items });
  } catch (error) {
    logger.error("Get template error", error, "Safety/Templates");
    return NextResponse.json(
      { error: "Failed to fetch template" },
      { status: 500 }
    );
  }
}

// Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const { name, category, description, emoji, checklistItems, isActive } = body;

    // Verify template belongs to company
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM "TaskTemplate"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Update template
    await prisma.$executeRaw`
      UPDATE "TaskTemplate"
      SET 
        name = ${name},
        category = ${category},
        description = ${description || null},
        emoji = ${emoji || null},
        "isActive" = ${isActive !== undefined ? isActive : true},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
    `;

    // Update checklist items if provided
    if (checklistItems) {
      // Delete existing items
      await prisma.$executeRaw`
        DELETE FROM "TemplateChecklistItem" WHERE "templateId" = ${parseInt(id)}
      `;

      // Insert new items
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        await prisma.$executeRaw`
          INSERT INTO "TemplateChecklistItem" (
            "templateId", "itemText", "itemOrder", "requiresPhoto", 
            "requiresTemperature", "requiresNotes", "createdAt"
          )
          VALUES (
            ${parseInt(id)}, ${item.text}, ${i + 1}, 
            ${item.requiresPhoto || false}, 
            ${item.requiresTemperature || false}, 
            ${item.requiresNotes || false}, 
            CURRENT_TIMESTAMP
          )
        `;
      }
    }

    // Fetch updated template
    const template = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskTemplate" WHERE id = ${parseInt(id)}
    `;

    const items = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemplateChecklistItem"
      WHERE "templateId" = ${parseInt(id)}
      ORDER BY "itemOrder" ASC
    `;

    return NextResponse.json({ ...template[0], checklistItems: items });
  } catch (error) {
    logger.error("Update template error", error, "Safety/Templates");
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    // Verify template belongs to company and is not a system template
    const template = await prisma.$queryRaw<any[]>`
      SELECT id, "isSystemTemplate" FROM "TaskTemplate"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (template.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template[0].isSystemTemplate) {
      return NextResponse.json(
        { error: "Cannot delete system templates" },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.$executeRaw`
      UPDATE "TaskTemplate"
      SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete template error", error, "Safety/Templates");
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

