import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get single task detail
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

    const task = await prisma.$queryRaw<any[]>`
      SELECT 
        ti.*,
        t.name as "templateName",
        t.category as "templateCategory",
        t.emoji as "templateEmoji",
        t.description as "templateDescription",
        st."scheduleType",
        st."timeWindow",
        st."timeWindowStart",
        st."timeWindowEnd",
        st."enforceTimeWindow",
        u.name as "assignedToName",
        u.email as "assignedToEmail"
      FROM "TaskInstance" ti
      JOIN "TaskTemplate" t ON t.id = ti."templateId"
      LEFT JOIN "ScheduledTask" st ON st.id = ti."scheduledTaskId"
      LEFT JOIN "User" u ON u.id = ti."assignedTo"
      WHERE ti.id = ${parseInt(id)} AND ti."companyId" = ${companyId}
    `;

    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get checklist items from template
    const checklistItems = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TemplateChecklistItem"
      WHERE "templateId" = ${task[0].templateId}
      ORDER BY "itemOrder" ASC
    `;

    // Get existing completion if any
    const completion = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskCompletion"
      WHERE "taskInstanceId" = ${parseInt(id)}
      ORDER BY "completedAt" DESC
      LIMIT 1
    `;

    // Get completion checklist items if exists
    let completionItems: any[] = [];
    if (completion.length > 0) {
      completionItems = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ChecklistItemCompletion"
        WHERE "taskCompletionId" = ${completion[0].id}
        ORDER BY "itemOrder" ASC
      `;
    }

    // Get comments
    const comments = await prisma.$queryRaw<any[]>`
      SELECT * FROM "TaskComment"
      WHERE "taskInstanceId" = ${parseInt(id)}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json({
      ...task[0],
      checklistItems,
      completion: completion.length > 0 ? { ...completion[0], items: completionItems } : null,
      comments,
    });
  } catch (error) {
    logger.error("Get task error", error, "Safety/Tasks");
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

