import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Get cleaning jobs
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

    // Check permission
    const canView = await checkPermission(
      session.id,
      companyId,
      "cleaning:view"
    );
    if (!canView) {
      return NextResponse.json(
        { error: "No permission to view cleaning jobs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const membershipId = searchParams.get("membershipId");
    const productionPlanId = searchParams.get("productionPlanId");
    const completed = searchParams.get("completed");

    const jobs = await prisma.cleaningJob.findMany({
      where: {
        companyId,
        ...(membershipId && { membershipId: parseInt(membershipId) }),
        ...(productionPlanId && { productionPlanId: parseInt(productionPlanId) }),
        ...(completed === "true"
          ? { completedAt: { not: null } }
          : completed === "false"
          ? { completedAt: null }
          : {}),
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
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Get cleaning jobs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cleaning jobs" },
      { status: 500 }
    );
  }
}

// Create cleaning job
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

    // Check permission
    const canCreate = await checkPermission(
      session.id,
      companyId,
      "cleaning:create"
    );
    if (!canCreate) {
      return NextResponse.json(
        { error: "No permission to create cleaning jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      frequency,
      membershipId,
      productionPlanId,
      dueDate,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name required" },
        { status: 400 }
      );
    }

    const job = await prisma.cleaningJob.create({
      data: {
        companyId,
        name,
        description,
        category,
        frequency: frequency || "daily",
        membershipId: membershipId || null,
        productionPlanId: productionPlanId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
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
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("Create cleaning job error:", error);
    return NextResponse.json(
      { error: "Failed to create cleaning job" },
      { status: 500 }
    );
  }
}

