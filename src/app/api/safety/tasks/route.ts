import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get tasks for a date range
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
    const date = searchParams.get("date"); // YYYY-MM-DD format
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    let query = `
      SELECT 
        ti.*,
        t.name as "templateName",
        t.category as "templateCategory",
        t.emoji as "templateEmoji",
        st."scheduleType",
        st."timeWindow",
        st."timeWindowStart",
        st."timeWindowEnd",
        st."enforceTimeWindow",
        u.name as "assignedToName",
        tc.id as "completionId",
        tc.status as "completionStatus"
      FROM "TaskInstance" ti
      JOIN "TaskTemplate" t ON t.id = ti."templateId"
      LEFT JOIN "ScheduledTask" st ON st.id = ti."scheduledTaskId"
      LEFT JOIN "User" u ON u.id = ti."assignedTo"
      LEFT JOIN "TaskCompletion" tc ON tc."taskInstanceId" = ti.id AND tc."completionDate" = ti."dueDate"
      WHERE ti."companyId" = $1
    `;

    const params: any[] = [companyId];

    if (date) {
      query += ` AND ti."dueDate" = $${params.length + 1}`;
      params.push(date);
    }

    if (status) {
      query += ` AND ti.status = $${params.length + 1}`;
      params.push(status);
    }

    if (assignedTo) {
      query += ` AND ti."assignedTo" = $${params.length + 1}`;
      params.push(parseInt(assignedTo));
    }

    query += ` ORDER BY ti."dueTime" ASC NULLS LAST, ti."createdAt" ASC`;

    const tasks = await prisma.$queryRawUnsafe<any[]>(query, ...params);

    return NextResponse.json(tasks);
  } catch (error) {
    logger.error("Get tasks error", error, "Safety/Tasks");
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

