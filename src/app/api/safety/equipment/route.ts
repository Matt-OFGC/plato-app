import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get all equipment
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
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    let query = `
      SELECT 
        e.*,
        COUNT(issue.id) FILTER (WHERE issue.status = 'open') as "openIssuesCount"
      FROM "EquipmentRegister" e
      LEFT JOIN "EquipmentIssue" issue ON issue."equipmentId" = e.id
      WHERE e."companyId" = $1
    `;

    const params: any[] = [companyId];

    if (status) {
      query += ` AND e.status = $${params.length + 1}`;
      params.push(status);
    }

    if (category) {
      query += ` AND e."equipmentCategory" = $${params.length + 1}`;
      params.push(category);
    }

    query += ` GROUP BY e.id ORDER BY e."equipmentName" ASC`;

    const equipment = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Get equipment error:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

// Create new equipment
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const {
      equipmentName,
      equipmentCategory,
      location,
      lastServiceDate,
      nextServiceDate,
      warrantyExpiry,
      notes,
    } = body;

    if (!equipmentName) {
      return NextResponse.json(
        { error: "Equipment name is required" },
        { status: 400 }
      );
    }

    // Generate QR code
    const qrCode = `EQ-${companyId}-${Date.now()}`;

    const equipment = await prisma.$queryRaw<any[]>`
      INSERT INTO "EquipmentRegister" (
        "companyId", "equipmentName", "equipmentCategory", location,
        "qrCode", "lastServiceDate", "nextServiceDate", "warrantyExpiry",
        status, notes, "createdAt", "updatedAt"
      )
      VALUES (
        ${companyId}, ${equipmentName}, ${equipmentCategory || null}, ${location || null},
        ${qrCode}, ${lastServiceDate || null}, ${nextServiceDate || null}, ${warrantyExpiry || null},
        'good', ${notes || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    return NextResponse.json(equipment[0]);
  } catch (error) {
    console.error("Create equipment error:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}

