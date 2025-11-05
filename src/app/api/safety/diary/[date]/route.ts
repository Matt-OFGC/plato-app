import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get diary entries for a specific date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Get completed tasks
    let completed: any[] = [];
    try {
      completed = await prisma.$queryRaw<any[]>`
        SELECT 
          tc.*,
          t.emoji as "templateEmoji",
          t.category as "templateCategory",
          u.name as "completedByName",
          u.email as "completedByEmail"
        FROM "TaskCompletion" tc
        JOIN "TaskTemplate" t ON t.id = tc."templateId"
        JOIN "User" u ON u.id = tc."completedBy"
        WHERE tc."companyId" = ${companyId} AND tc."completionDate" = ${date}
        ORDER BY tc."completedAt" DESC
      `;
    } catch (error: any) {
      // If tables don't exist, return empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('Safety tables do not exist yet');
        return NextResponse.json({
          date,
          completed: [],
          pending: [],
          stats: {
            totalTasks: 0,
            completedCount: 0,
            pendingCount: 0,
            flaggedCount: 0,
            complianceScore: 100,
          },
        });
      }
      throw error;
    }

    // Get checklist items and photos for each completion
    const completedWithDetails = await Promise.all(
      completed.map(async (comp) => {
        const items = await prisma.$queryRaw<any[]>`
          SELECT * FROM "ChecklistItemCompletion"
          WHERE "taskCompletionId" = ${comp.id}
          ORDER BY "itemOrder" ASC
        `;

        const photos = await prisma.$queryRaw<any[]>`
          SELECT * FROM "TaskPhoto"
          WHERE "taskCompletionId" = ${comp.id}
          ORDER BY "uploadedAt" ASC
        `;

        return { ...comp, checklistItems: items, photos };
      })
    );

    // Get pending tasks for this date
    let pending: any[] = [];
    try {
      pending = await prisma.$queryRaw<any[]>`
        SELECT 
          ti.*,
          t.name as "templateName",
          t.category as "templateCategory",
          t.emoji as "templateEmoji",
          u.name as "assignedToName"
        FROM "TaskInstance" ti
        JOIN "TaskTemplate" t ON t.id = ti."templateId"
        LEFT JOIN "User" u ON u.id = ti."assignedTo"
        WHERE ti."companyId" = ${companyId} 
          AND ti."dueDate" = ${date}
          AND ti.status != 'completed'
        ORDER BY ti."dueTime" ASC NULLS LAST
      `;
    } catch (error: any) {
      // If tables don't exist, pending will be empty array
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('TaskInstance table does not exist yet');
        pending = [];
      } else {
        throw error;
      }
    }

    // Calculate compliance score
    const totalTasks = completed.length + pending.length;
    const completedCount = completed.length;
    const flaggedCount = completed.filter((c: any) => c.status === "flagged").length;
    const complianceScore = totalTasks > 0 
      ? Math.round(((completedCount - flaggedCount) / totalTasks) * 100)
      : 100;

    return NextResponse.json({
      date,
      completed: completedWithDetails,
      pending,
      stats: {
        totalTasks,
        completedCount,
        pendingCount: pending.length,
        flaggedCount,
        complianceScore,
      },
    });
  } catch (error: any) {
    console.error("Get diary error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch diary entries",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

