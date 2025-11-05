import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get daily AM/PM checks
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const period = searchParams.get("period"); // AM or PM
    const { companyId } = await getCurrentUserAndCompany();

    let query = `
      SELECT 
        dtc.*,
        u.name as "completedByName"
      FROM "DailyTemperatureCheck" dtc
      LEFT JOIN "User" u ON u.id = dtc."completedBy"
      WHERE dtc."companyId" = $1 AND dtc."checkDate" = $2
    `;
    const params: any[] = [companyId, date];

    if (period) {
      query += ` AND dtc."checkPeriod" = $${params.length + 1}`;
      params.push(period);
    }

    query += ` ORDER BY dtc."checkType" ASC`;

    const checks = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json(checks);
  } catch (error) {
    console.error("Get daily checks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily checks" },
      { status: 500 }
    );
  }
}

// Save daily AM/PM checks
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId, userId } = await getCurrentUserAndCompany();
    const body = await request.json();
    const { checks, date, period } = body;

    if (!checks || !Array.isArray(checks) || !date || !period) {
      return NextResponse.json(
        { error: "Checks array, date, and period required" },
        { status: 400 }
      );
    }

    const savedChecks = [];
    for (const check of checks) {
      if (check.checkType) {
        const result = await prisma.$executeRaw<Array<{ id: number }>>`
          INSERT INTO "DailyTemperatureCheck" (
            "companyId", "checkDate", "checkPeriod", "checkType",
            "temperature", "unit", "notes", "completed", "completedBy", "completedAt"
          )
          VALUES (
            ${companyId}, ${date}, ${period}, ${check.checkType},
            ${check.temperature || null}, 'celsius', ${check.notes || null},
            ${check.completed || false}, ${check.completed ? userId : null},
            ${check.completed ? new Date() : null}
          )
          ON CONFLICT ("companyId", "checkDate", "checkPeriod", "checkType")
          DO UPDATE SET
            "temperature" = EXCLUDED."temperature",
            "notes" = EXCLUDED."notes",
            "completed" = EXCLUDED."completed",
            "completedBy" = EXCLUDED."completedBy",
            "completedAt" = EXCLUDED."completedAt",
            "updatedAt" = CURRENT_TIMESTAMP
          RETURNING id
        `;
        savedChecks.push({
          ...check,
          id: result[0]?.id,
        });
      }
    }

    return NextResponse.json({ success: true, checks: savedChecks });
  } catch (error) {
    console.error("Save daily checks error:", error);
    return NextResponse.json(
      { error: "Failed to save daily checks" },
      { status: 500 }
    );
  }
}

