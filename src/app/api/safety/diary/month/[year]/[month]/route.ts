import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

// Get month activity summary for calendar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { year, month } = await params;
    const { companyId } = await getCurrentUserAndCompany();

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    // Get date range for the month
    const startDate = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];

    // Get all completions for the month
    let completions: any[] = [];
    let pending: any[] = [];
    
    try {
      completions = await prisma.$queryRaw<any[]>`
        SELECT 
          "completionDate",
          status,
          COUNT(*) as count
        FROM "TaskCompletion"
        WHERE "companyId" = ${companyId}
          AND "completionDate" >= ${startDate}
          AND "completionDate" <= ${endDate}
        GROUP BY "completionDate", status
      `;
    } catch (error: any) {
      // If table doesn't exist, return empty activity
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('TaskCompletion table does not exist yet');
        return NextResponse.json({});
      }
      throw error;
    }

    try {
      // Get pending tasks for the month
      pending = await prisma.$queryRaw<any[]>`
        SELECT 
          "dueDate",
          COUNT(*) as count
        FROM "TaskInstance"
        WHERE "companyId" = ${companyId}
          AND "dueDate" >= ${startDate}
          AND "dueDate" <= ${endDate}
          AND status != 'completed'
        GROUP BY "dueDate"
      `;
    } catch (error: any) {
      // If table doesn't exist, pending will be empty
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.warn('TaskInstance table does not exist yet');
        pending = [];
      } else {
        throw error;
      }
    }

    // Build activity map
    const activity: Record<string, { completed: number; flagged: number; pending: number }> = {};

    completions.forEach((row: any) => {
      const date = row.completionDate;
      if (!activity[date]) {
        activity[date] = { completed: 0, flagged: 0, pending: 0 };
      }
      if (row.status === "flagged") {
        activity[date].flagged += parseInt(row.count);
      } else {
        activity[date].completed += parseInt(row.count);
      }
    });

    pending.forEach((row: any) => {
      const date = row.dueDate;
      if (!activity[date]) {
        activity[date] = { completed: 0, flagged: 0, pending: 0 };
      }
      activity[date].pending += parseInt(row.count);
    });

    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("Get month activity error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch month activity",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

