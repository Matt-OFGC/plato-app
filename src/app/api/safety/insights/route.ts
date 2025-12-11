import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import { logger } from "@/lib/logger";

// Get AI insights for company
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

    const insights = [];

    // 1. Efficiency Insights - Task duration analysis
    const taskDurations = await prisma.$queryRaw<any[]>`
      SELECT 
        tc."taskName",
        AVG(tc."durationMinutes") as "avgDuration",
        COUNT(*) as "completionCount"
      FROM "TaskCompletion" tc
      WHERE tc."companyId" = ${companyId}
        AND tc."durationMinutes" IS NOT NULL
        AND tc."completedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY tc."taskName"
      HAVING COUNT(*) >= 5
      ORDER BY "avgDuration" DESC
      LIMIT 5
    `;

    taskDurations.forEach((task: any) => {
      if (parseFloat(task.avgDuration) > 30) {
        insights.push({
          type: "efficiency",
          severity: "info",
          title: `${task.taskName} Taking Longer`,
          message: `Average completion time is ${Math.round(parseFloat(task.avgDuration))} minutes. Consider reviewing the process.`,
          recommendation: "Review task checklist for optimization opportunities",
          impact: "medium",
        });
      }
    });

    // 2. Compliance Insights - Flagged items pattern
    const flaggedItems = await prisma.$queryRaw<any[]>`
      SELECT 
        "taskCategory",
        COUNT(*) as "flaggedCount"
      FROM "TaskCompletion"
      WHERE "companyId" = ${companyId}
        AND status = 'flagged'
        AND "completedAt" >= NOW() - INTERVAL '7 days'
      GROUP BY "taskCategory"
      HAVING COUNT(*) >= 3
    `;

    flaggedItems.forEach((item: any) => {
      insights.push({
        type: "compliance",
        severity: "warning",
        title: `Multiple ${item.taskCategory} Issues`,
        message: `${item.flaggedCount} flagged items in ${item.taskCategory} category this week.`,
        recommendation: "Review training procedures for this category",
        impact: "high",
      });
    });

    // 3. Pattern Insights - Day of week analysis
    const dayPatterns = await prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(DOW FROM "completedAt") as "dayOfWeek",
        COUNT(*) as "completionCount",
        AVG(EXTRACT(EPOCH FROM ("completedAt" - DATE_TRUNC('day', "completedAt")))/60) as "avgCompletionHour"
      FROM "TaskCompletion"
      WHERE "companyId" = ${companyId}
        AND "completedAt" >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM "completedAt")
      ORDER BY "avgCompletionHour"
    `;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    dayPatterns.forEach((pattern: any) => {
      const hour = Math.round(parseFloat(pattern.avgCompletionHour) / 60);
      if (hour > 10) {
        insights.push({
          type: "pattern",
          severity: "info",
          title: `${dayNames[pattern.dayOfWeek]} Tasks Often Late`,
          message: `Tasks on ${dayNames[pattern.dayOfWeek]} are typically completed after ${hour}:00.`,
          recommendation: "Consider adjusting schedule or adding reminders",
          impact: "low",
        });
      }
    });

    // 4. Positive Reinforcement
    const recentCompletions = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as "totalCompletions"
      FROM "TaskCompletion"
      WHERE "companyId" = ${companyId}
        AND "completedAt" >= NOW() - INTERVAL '7 days'
        AND status = 'completed'
    `;

    const totalCompletions = parseInt(recentCompletions[0]?.totalCompletions || "0");
    if (totalCompletions > 50) {
      insights.push({
        type: "positive",
        severity: "info",
        title: "Excellent Compliance This Week",
        message: `${totalCompletions} tasks completed successfully with zero flagged items.`,
        recommendation: "Keep up the great work!",
        impact: "positive",
      });
    }

    return NextResponse.json(insights);
  } catch (error) {
    logger.error("Get insights error", error, "Safety/Insights");
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

