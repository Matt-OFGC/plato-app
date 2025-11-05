import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Duplicate a template
export async function POST(
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
    const { name } = body;

    // Get original template
    const original = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskTemplate"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (original.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const templateName = name || `${original[0].name} (Copy)`;

    // Get checklist items
    const items = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemplateChecklistItem"
      WHERE "templateId" = ${parseInt(id)}
      ORDER BY "itemOrder" ASC
    `;

    // Create duplicate
    const result = await prisma.$transaction(async (tx) => {
      const newTemplate = await tx.$queryRaw<any[]>`
        INSERT INTO "TaskTemplate" (
          "companyId", category, name, description, emoji, "isSystemTemplate", 
          "isActive", "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          ${companyId}, ${original[0].category}, ${templateName}, 
          ${original[0].description || null}, ${original[0].emoji || null}, 
          false, true, ${session.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const templateId = newTemplate[0].id;

      // Copy checklist items
      for (const item of items) {
        await tx.$executeRaw`
          INSERT INTO "TemplateChecklistItem" (
            "templateId", "itemText", "itemOrder", "requiresPhoto", 
            "requiresTemperature", "requiresNotes", "createdAt"
          )
          VALUES (
            ${templateId}, ${item.itemText}, ${item.itemOrder}, 
            ${item.requiresPhoto}, ${item.requiresTemperature}, 
            ${item.requiresNotes}, CURRENT_TIMESTAMP
          )
        `;
      }

      const newItems = await tx.$queryRaw<any[]>`
        SELECT * FROM "TemplateChecklistItem"
        WHERE "templateId" = ${templateId}
        ORDER BY "itemOrder" ASC
      `;

      return { ...newTemplate[0], checklistItems: newItems };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Duplicate template error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate template" },
      { status: 500 }
    );
  }
}

