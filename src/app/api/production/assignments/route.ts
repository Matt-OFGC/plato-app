import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Get production assignments
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
    const productionItemId = searchParams.get("productionItemId");
    const assignedDate = searchParams.get("assignedDate");

    const assignments = await prisma.productionJobAssignment.findMany({
      where: {
        productionItem: {
          plan: {
            companyId,
          },
        },
        ...(membershipId && { membershipId: parseInt(membershipId) }),
        ...(productionItemId && { productionItemId: parseInt(productionItemId) }),
        ...(assignedDate && {
          assignedDate: {
            gte: new Date(assignedDate),
            lt: new Date(
              new Date(assignedDate).setDate(
                new Date(assignedDate).getDate() + 1
              )
            ),
          },
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
        productionItem: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
              },
            },
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedDate: "desc",
      },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    logger.error("Get production assignments error", error, "Production/Assignments");
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// Create production assignment
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
    const canAssign = await checkPermission(
      session.id,
      companyId,
      "production:assign"
    );
    if (!canAssign) {
      return NextResponse.json(
        { error: "No permission to assign production jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { productionItemId, membershipId, assignedDate, notes } = body;

    if (!productionItemId || !membershipId || !assignedDate) {
      return NextResponse.json(
        { error: "Production item ID, membership ID, and assigned date required" },
        { status: 400 }
      );
    }

    // Verify production item belongs to company
    const productionItem = await prisma.productionItem.findUnique({
      where: { id: productionItemId },
      include: {
        plan: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!productionItem || productionItem.plan.companyId !== companyId) {
      return NextResponse.json(
        { error: "Production item not found" },
        { status: 404 }
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

    const assignment = await prisma.productionJobAssignment.create({
      data: {
        productionItemId,
        membershipId,
        assignedDate: new Date(assignedDate),
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
        productionItem: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    logger.error("Create production assignment error", error, "Production/Assignments");
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Assignment already exists for this item and date" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

