import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Get training records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membershipId");
    const moduleId = searchParams.get("moduleId");
    const status = searchParams.get("status");

    const records = await prisma.trainingRecord.findMany({
      where: {
        membership: {
          companyId,
        },
        ...(membershipId && { membershipId: parseInt(membershipId) }),
        ...(moduleId && { moduleId: parseInt(moduleId) }),
        ...(status && { status }),
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
        module: {
          select: {
            id: true,
            title: true,
            refreshFrequencyDays: true,
          },
        },
        signedOffByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Get training records error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training records" },
      { status: 500 }
    );
  }
}

// Create or update training record
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    if (!companyId) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const body = await request.json();
    const { membershipId, moduleId, status, completionNotes } = body;

    if (!membershipId || !moduleId) {
      return NextResponse.json(
        { error: "Membership ID and Module ID required" },
        { status: 400 }
      );
    }

    // Verify membership belongs to company
    const membership = await prisma.membership.findUnique({
      where: {
        id: membershipId,
        companyId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Users can update their own records, managers can assign
    const canAssign = await checkPermission(
      session.id,
      companyId,
      "training:assign"
    );
    const isOwnRecord = membership.userId === session.id;

    if (!canAssign && !isOwnRecord) {
      return NextResponse.json(
        { error: "No permission to update this record" },
        { status: 403 }
      );
    }

    // Get module to check refresh frequency
    const module = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      select: { refreshFrequencyDays: true },
    });

    const now = new Date();
    let nextRefreshDate: Date | null = null;

    if (status === "completed" && module?.refreshFrequencyDays) {
      nextRefreshDate = new Date(now);
      nextRefreshDate.setDate(
        nextRefreshDate.getDate() + module.refreshFrequencyDays
      );
    }

    // Check if record exists
    const existingRecord = await prisma.trainingRecord.findUnique({
      where: {
        membershipId_moduleId: {
          membershipId,
          moduleId,
        },
      },
    });

    // Upsert record
    const record = await prisma.trainingRecord.upsert({
      where: {
        membershipId_moduleId: {
          membershipId,
          moduleId,
        },
      },
      update: {
        status: status || undefined,
        ...(status === "in_progress" && !existingRecord?.startedAt && {
          startedAt: now,
        }),
        ...(status === "completed" && {
          completedAt: now,
          nextRefreshDate,
          completionNotes,
        }),
      },
      create: {
        membershipId,
        moduleId,
        status: status || "not_started",
        ...(status === "in_progress" && { startedAt: now }),
        ...(status === "completed" && {
          completedAt: now,
          nextRefreshDate,
          completionNotes,
        }),
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
        module: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Create training record error:", error);
    return NextResponse.json(
      { error: "Failed to create training record" },
      { status: 500 }
    );
  }
}

