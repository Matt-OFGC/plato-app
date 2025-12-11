import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get equipment details
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

    const equipment = await prisma.$queryRaw<any[]>`
      SELECT * FROM "EquipmentRegister"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Get issues
    const issues = await prisma.$queryRaw<any[]>`
      SELECT ei.*, u.name as "reportedByName"
      FROM "EquipmentIssue" ei
      LEFT JOIN "User" u ON u.id = ei."reportedBy"
      WHERE ei."equipmentId" = ${parseInt(id)}
      ORDER BY ei."reportedAt" DESC
    `;

    return NextResponse.json({
      ...equipment[0],
      issues,
    });
  } catch (error) {
    logger.error("Get equipment error", error, "Safety/Equipment");
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// Update equipment
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

    const {
      equipmentName,
      equipmentCategory,
      location,
      lastServiceDate,
      nextServiceDate,
      warrantyExpiry,
      status,
      notes,
    } = body;

    await prisma.$executeRaw`
      UPDATE "EquipmentRegister"
      SET
        "equipmentName" = ${equipmentName},
        "equipmentCategory" = ${equipmentCategory || null},
        location = ${location || null},
        "lastServiceDate" = ${lastServiceDate || null},
        "nextServiceDate" = ${nextServiceDate || null},
        "warrantyExpiry" = ${warrantyExpiry || null},
        status = ${status || 'good'},
        notes = ${notes || null},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM "EquipmentRegister" WHERE id = ${parseInt(id)}
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    logger.error("Update equipment error", error, "Safety/Equipment");
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}

// Delete equipment
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

    await prisma.$executeRaw`
      DELETE FROM "EquipmentRegister"
      WHERE id = ${parseInt(id)} AND "companyId" = ${companyId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete equipment error", error, "Safety/Equipment");
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}

