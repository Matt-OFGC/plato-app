import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Report an equipment issue
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
    const { issueDescription, severity } = body;

    if (!issueDescription) {
      return NextResponse.json(
        { error: "Issue description is required" },
        { status: 400 }
      );
    }

    // Verify equipment belongs to company
    const equipment = await prisma.$queryRaw<any[]>`
      SELECT id FROM "EquipmentRegister"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Create issue
    const issue = await prisma.$queryRaw<any[]>`
      INSERT INTO "EquipmentIssue" (
        "equipmentId", "companyId", "issueDescription", severity,
        status, "reportedBy", "reportedAt"
      )
      VALUES (
        ${parseInt(id)}, ${companyId}, ${issueDescription}, ${severity || 'medium'},
        'open', ${session.id}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    // Update equipment status if severity is high or critical
    if (severity === "high" || severity === "critical") {
      await prisma.$executeRaw`
        UPDATE "EquipmentRegister"
        SET status = 'maintenance_required', "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${parseInt(id)}
      `;
    }

    // Create alert
    await prisma.$queryRaw`
      INSERT INTO "SmartAlert" (
        "companyId", "alertType", severity, title, message,
        "actionRequired", "relatedEntityType", "relatedEntityId", "createdAt"
      )
      VALUES (
        ${companyId}, 'equipment', ${severity || 'medium'},
        ${`Equipment Issue: ${equipment[0].equipmentName || 'Unknown'}`},
        ${issueDescription},
        ${`Review and resolve equipment issue`},
        'equipment', ${parseInt(id)}, CURRENT_TIMESTAMP
      )
    `;

    return NextResponse.json(issue[0]);
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to report issue" },
      { status: 500 }
    );
  }
}

