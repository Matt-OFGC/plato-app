import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get all templates for a company
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let templates: any[] = [];
    try {
      // Build query dynamically based on filters
      let query = `
        SELECT 
          t.*,
          COUNT(c.id) as "checklistItemsCount"
        FROM "TaskTemplate" t
        LEFT JOIN "TemplateChecklistItem" c ON c."templateId" = t.id
        WHERE t."companyId" = $1
      `;
      const params: any[] = [companyId];
      let paramIndex = 2;

      if (category) {
        query += ` AND t.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (!includeInactive) {
        query += ` AND t."isActive" = true`;
      }

      query += ` GROUP BY t.id ORDER BY t."isSystemTemplate" DESC, t."createdAt" DESC`;

      templates = await prisma.$queryRawUnsafe<any[]>(query, ...params);
    } catch (error: any) {
      // If TaskTemplate table doesn't exist, return empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        logger.warn('TaskTemplate table does not exist yet. Run migration: npx tsx src/app/scripts/migrate-safety-schema.ts', null, "Safety/Templates");
        return NextResponse.json([]);
      }
      logger.error("Templates query error", error, "Safety/Templates");
      throw error;
    }

    // Get checklist items for each template
    const templatesWithItems = await Promise.all(
      templates.map(async (template) => {
        const items = await prisma.$queryRaw<any[]>`
          SELECT * FROM "TemplateChecklistItem"
          WHERE "templateId" = ${template.id}
          ORDER BY "itemOrder" ASC
        `;
        return { ...template, checklistItems: items };
      })
    );

    return NextResponse.json(templatesWithItems);
  } catch (error: any) {
    logger.error("Get templates error", error, "Safety/Templates");
    return NextResponse.json(
      { 
        error: "Failed to fetch templates",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, description, emoji, checklistItems } = body;

    if (!name || !category || !checklistItems || checklistItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for duplicate names
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM "TaskTemplate"
      WHERE "companyId" = ${companyId} AND name = ${name} AND "isActive" = true
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 400 }
      );
    }

    // Create template and items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create template
      const template = await tx.$queryRaw<any[]>`
        INSERT INTO "TaskTemplate" (
          "companyId", category, name, description, emoji, "createdBy", "createdAt", "updatedAt"
        )
        VALUES (
          ${companyId}, ${category}, ${name}, ${description || null}, ${emoji || null}, 
          ${session.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const templateId = template[0].id;

      // Create checklist items
      for (let i = 0; i < checklistItems.length; i++) {
        const item = checklistItems[i];
        await tx.$executeRaw`
          INSERT INTO "TemplateChecklistItem" (
            "templateId", "itemText", "itemOrder", "requiresPhoto", 
            "requiresTemperature", "requiresNotes", "createdAt"
          )
          VALUES (
            ${templateId}, ${item.text}, ${i + 1}, 
            ${item.requiresPhoto || false}, 
            ${item.requiresTemperature || false}, 
            ${item.requiresNotes || false}, 
            CURRENT_TIMESTAMP
          )
        `;
      }

      // Fetch complete template with items
      const items = await tx.$queryRaw<any[]>`
        SELECT * FROM "TemplateChecklistItem"
        WHERE "templateId" = ${templateId}
        ORDER BY "itemOrder" ASC
      `;

      return { ...template[0], checklistItems: items };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Create template error", error, "Safety/Templates");
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

