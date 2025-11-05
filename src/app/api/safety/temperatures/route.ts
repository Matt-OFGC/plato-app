import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get temperature records for a date range
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const applianceName = searchParams.get("applianceName");
    const { companyId } = await getCurrentUserAndCompany();

    let query = `
      SELECT 
        tr.*,
        u.name as "recordedByName"
      FROM "TemperatureRecord" tr
      LEFT JOIN "User" u ON u.id = tr."recordedBy"
      WHERE tr."companyId" = $1
    `;
    const params: any[] = [companyId];

    if (date) {
      query += ` AND DATE(tr."recordedAt") = $${params.length + 1}`;
      params.push(date);
    } else if (startDate && endDate) {
      query += ` AND DATE(tr."recordedAt") BETWEEN $${params.length + 1} AND $${params.length + 2}`;
      params.push(startDate, endDate);
    }

    if (applianceName) {
      query += ` AND tr."applianceName" = $${params.length + 1}`;
      params.push(applianceName);
    }

    query += ` ORDER BY tr."recordedAt" DESC LIMIT 1000`;

    try {
      const records = await prisma.$queryRawUnsafe<any[]>(query, ...params);
      return NextResponse.json(records);
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('TemperatureRecord table does not exist yet. Run migration: npx tsx src/app/scripts/add-temperature-storage.ts');
        return NextResponse.json([]);
      }
      throw error;
    }
  } catch (error) {
    console.error("Get temperature records error:", error);
    return NextResponse.json(
      { error: "Failed to fetch temperature records" },
      { status: 500 }
    );
  }
}

// Save temperature records (for hot holding, reheating, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, userId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const { records, recordType } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Records array required" },
        { status: 400 }
      );
    }

    const savedRecords = [];
    try {
      for (const record of records) {
        if (record.temperature !== null && record.temperature !== undefined) {
          const result = await prisma.$executeRaw<Array<{ id: number }>>`
            INSERT INTO "TemperatureRecord" (
              "companyId", "applianceName", "applianceType", "recordType",
              "temperature", "unit", "location", "notes", "recordedBy", "recordedAt"
            )
            VALUES (
              ${companyId}, 
              ${record.applianceName || record.itemName || 'Unknown'}, 
              ${record.applianceType || record.type || 'other'},
              ${recordType || 'other'},
              ${record.temperature}, 
              'celsius',
              ${record.location || null},
              ${record.notes || null},
              ${userId}, 
              CURRENT_TIMESTAMP
            )
            RETURNING id
          `;
          savedRecords.push({
            ...record,
            id: result[0]?.id,
          });
        }
      }
    } catch (error: any) {
      // If table doesn't exist, log warning but return empty records
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('TemperatureRecord table does not exist yet. Run migration: npx tsx src/app/scripts/add-temperature-storage.ts');
        return NextResponse.json({ success: false, error: 'Database tables not migrated. Please run migration script.' });
      }
      throw error;
    }

    return NextResponse.json({ success: true, records: savedRecords });
  } catch (error) {
    console.error("Save temperature records error:", error);
    return NextResponse.json(
      { error: "Failed to save temperature records" },
      { status: 500 }
    );
  }
}

