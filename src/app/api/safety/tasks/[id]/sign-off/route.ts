import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";
import bcrypt from "bcrypt";

// Complete task with sign-off
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
    const { 
      completedBy, 
      pin, 
      notes, 
      checklistItems, 
      status: completionStatus,
      durationMinutes,
      deviceId,
      ipAddress 
    } = body;

    if (!completedBy || !pin || !checklistItems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify PIN
    const membership = await prisma.$queryRaw<any[]>`
      SELECT m.*, u.name, u.email
      FROM "Membership" m
      JOIN "User" u ON u.id = m."userId"
      WHERE m."userId" = ${completedBy} 
        AND m."companyId" = ${companyId}
        AND m."isActive" = true
    `;

    if (membership.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const mem = membership[0];
    if (!mem.pinHash) {
      return NextResponse.json({ error: "PIN not set for user" }, { status: 400 });
    }

    const isValidPin = await bcrypt.compare(pin, mem.pinHash);
    if (!isValidPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // Get task details with time window info
    const task = await prisma.$queryRaw<any[]>`
      SELECT 
        ti.*, 
        t.name as "templateName", 
        t.category as "templateCategory",
        st."timeWindowStart",
        st."timeWindowEnd",
        st."enforceTimeWindow"
      FROM "TaskInstance" ti
      JOIN "TaskTemplate" t ON t.id = ti."templateId"
      LEFT JOIN "ScheduledTask" st ON st.id = ti."scheduledTaskId"
      WHERE ti.id = ${parseInt(id)} AND ti."companyId" = ${companyId}
    `;

    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const taskData = task[0];

    // Check time window constraint if enforced
    if (taskData.enforceTimeWindow && taskData.timeWindowStart && taskData.timeWindowEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const startTime = taskData.timeWindowStart.toString();
      const endTime = taskData.timeWindowEnd.toString();
      
      if (currentTime < startTime || currentTime > endTime) {
        return NextResponse.json(
          { 
            error: `This task can only be completed between ${startTime.slice(0, 5)} and ${endTime.slice(0, 5)}. Current time: ${currentTime.slice(0, 5)}` 
          },
          { status: 400 }
        );
      }
    }

    // Count completed items
    const completedCount = checklistItems.filter((item: any) => item.checked).length;
    const totalCount = checklistItems.length;

    // Get client IP
    const clientIp = ipAddress || request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || "unknown";

    // Create completion record in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create task completion
      const completion = await tx.$queryRaw<any[]>`
        INSERT INTO "TaskCompletion" (
          "taskInstanceId", "companyId", "templateId", "completedBy",
          "completedByName", "completedByRole", "completedAt", "completionDate",
          "pinVerified", "deviceId", "ipAddress", "taskName", "taskCategory",
          "durationMinutes", notes, status, "checklistItemsTotal",
          "checklistItemsCompleted", "photosCount", "createdAt"
        )
        VALUES (
          ${parseInt(id)}, ${companyId}, ${taskData.templateId}, ${completedBy},
          ${mem.name}, ${mem.role}, CURRENT_TIMESTAMP, CURRENT_DATE,
          true, ${deviceId || null}, ${clientIp}, ${taskData.templateName}, 
          ${taskData.templateCategory}, ${durationMinutes || null}, 
          ${notes || null}, ${completionStatus || "completed"}, 
          ${totalCount}, ${completedCount}, 0, CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const completionId = completion[0].id;

      // Create checklist item completions
      for (const item of checklistItems) {
        await tx.$executeRaw`
          INSERT INTO "ChecklistItemCompletion" (
            "taskCompletionId", "itemText", "itemOrder", checked,
            "temperatureValue", "temperatureUnit", notes, "checkedAt", "createdAt"
          )
          VALUES (
            ${completionId}, ${item.itemText}, ${item.itemOrder}, ${item.checked || false},
            ${item.temperatureValue || null}, ${item.temperatureUnit || null},
            ${item.notes || null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
      }

      // Update task instance status
      await tx.$executeRaw`
        UPDATE "TaskInstance"
        SET status = ${completionStatus || "completed"}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = ${parseInt(id)}
      `;

      return completion[0];
    });

    return NextResponse.json({
      success: true,
      completion: result,
      completionDate: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Sign-off error:", error);
    return NextResponse.json(
      { error: "Failed to complete task" },
      { status: 500 }
    );
  }
}

