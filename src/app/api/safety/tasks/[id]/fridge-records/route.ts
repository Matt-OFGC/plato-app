import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get saved fridge/freezer appliances for a task template
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

    // Get task to find template
    const task = await prisma.$queryRaw<any[]>`
      SELECT "templateId" FROM "TaskInstance"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const templateId = task[0].templateId;

    // Get saved appliances for this template
    const appliances = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "applianceName",
        "applianceType",
        location,
        "orderIndex"
      FROM "TemplateAppliance"
      WHERE "templateId" = ${templateId} 
        AND "companyId" = ${companyId}
        AND "isActive" = true
      ORDER BY "orderIndex" ASC, "applianceName" ASC
    `;

    return NextResponse.json(appliances);
  } catch (error) {
    console.error("Get fridge appliances error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appliances" },
      { status: 500 }
    );
  }
}

// Save fridge/freezer appliances and temperature records
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
    const { companyId, userId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const { records, saveAppliances } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Records array required" },
        { status: 400 }
      );
    }

    // Get task details
    const task = await prisma.$queryRaw<any[]>`
      SELECT ti.*, t.name as "templateName"
      FROM "TaskInstance" ti
      JOIN "TaskTemplate" t ON t.id = ti."templateId"
      WHERE ti.id = ${parseInt(id)} AND ti."companyId" = ${companyId}
    `;

    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const templateId = task[0].templateId;
    const taskInstanceId = parseInt(id);

    // Save appliances to template if requested (so they persist for future tasks)
    if (saveAppliances) {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (record.applianceName) {
          // Use INSERT ... ON CONFLICT to update if exists
          await prisma.$executeRaw`
            INSERT INTO "TemplateAppliance" (
              "templateId", "companyId", "applianceName", "applianceType", 
              location, "orderIndex", "isActive"
            )
            VALUES (
              ${templateId}, ${companyId}, ${record.applianceName}, 
              ${record.type || 'fridge'}, 
              ${record.location || null}, ${i}, true
            )
            ON CONFLICT ("templateId", "applianceName", "companyId")
            DO UPDATE SET
              "applianceType" = EXCLUDED."applianceType",
              location = EXCLUDED.location,
              "orderIndex" = EXCLUDED."orderIndex",
              "isActive" = true,
              "updatedAt" = CURRENT_TIMESTAMP
          `;
        }
      }
    }

    // Save temperature records
    const savedRecords = [];
    for (const record of records) {
      if (record.applianceName && record.temperature !== null) {
        const result = await prisma.$executeRaw<Array<{ id: number }>>`
          INSERT INTO "TemperatureRecord" (
            "companyId", "templateId", "taskInstanceId", "applianceName",
            "applianceType", "recordType", "temperature", "unit", 
            "recordedBy", "recordedAt"
          )
          VALUES (
            ${companyId}, ${templateId}, ${taskInstanceId}, ${record.applianceName},
            ${record.type || 'fridge'}, 'fridge_freezer', ${record.temperature}, 
            'celsius', ${userId}, CURRENT_TIMESTAMP
          )
          RETURNING id
        `;
        savedRecords.push({
          ...record,
          id: result[0]?.id,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      records: savedRecords,
      appliancesSaved: saveAppliances || false
    });
  } catch (error) {
    console.error("Save fridge records error:", error);
    return NextResponse.json(
      { error: "Failed to save records" },
      { status: 500 }
    );
  }
}

