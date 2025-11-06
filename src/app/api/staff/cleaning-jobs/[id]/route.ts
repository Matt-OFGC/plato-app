import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Update cleaning job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    const body = await request.json();
    const { completed, membershipId, dueDate, notes } = body;

    // Get existing job
    const existingJob = await prisma.cleaningJob.findUnique({
      where: { id: jobId },
      select: { companyId: true, completedAt: true, membershipId: true },
    });

    if (!existingJob || existingJob.companyId !== companyId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check permission - users can complete their own jobs
    const canComplete = await checkPermission(
      session.id,
      companyId,
      "cleaning:complete"
    );
    let isAssignedToUser = false;
    if (existingJob.membershipId) {
      const membership = await prisma.membership.findUnique({
        where: { id: existingJob.membershipId },
        select: { userId: true },
      });
      isAssignedToUser = membership?.userId === session.id;
    }

    if (completed !== undefined && !canComplete && !isAssignedToUser) {
      return NextResponse.json(
        { error: "No permission to complete this job" },
        { status: 403 }
      );
    }

    const wasJustCompleted = completed === true && !existingJob.completedAt;

    const job = await prisma.cleaningJob.update({
      where: { id: jobId },
      data: {
        ...(completed !== undefined && {
          completedAt: completed ? new Date() : null,
          completedBy: completed ? session.id : null,
        }),
        ...(membershipId !== undefined && { membershipId }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        membership: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        productionPlan: {
          select: {
            id: true,
            name: true,
          },
        },
        completedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Update cleaning job error:", error);
    return NextResponse.json(
      { error: "Failed to update cleaning job" },
      { status: 500 }
    );
  }
}

