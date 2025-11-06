import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";

// Get all staff profiles for a company
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
    const canView = await checkPermission(session.id, companyId, "staff:view");
    if (!canView) {
      return NextResponse.json(
        { error: "No permission to view staff" },
        { status: 403 }
      );
    }

    const profiles = await prisma.staffProfile.findMany({
      where: {
        membership: {
          companyId,
          isActive: true,
        },
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
      },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Get staff profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff profiles" },
      { status: 500 }
    );
  }
}

// Create a staff profile
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
      "staff:create"
    );
    if (!canCreate) {
      return NextResponse.json(
        { error: "No permission to create staff profiles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      membershipId,
      employmentStartDate,
      position,
      status,
      emergencyContactName,
      emergencyContactPhone,
      notes,
      performanceNotes,
    } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID required" },
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

    const profile = await prisma.staffProfile.create({
      data: {
        membershipId,
        employmentStartDate: employmentStartDate
          ? new Date(employmentStartDate)
          : null,
        position,
        status: status || "active",
        emergencyContactName,
        emergencyContactPhone,
        notes,
        performanceNotes,
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
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    console.error("Create staff profile error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Profile already exists for this member" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create staff profile" },
      { status: 500 }
    );
  }
}

