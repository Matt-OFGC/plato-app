import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { getCurrentUserAndCompany } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { logger } from "@/lib/logger";

// Get staff profile by ID
export async function GET(
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
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }

    const profile = await prisma.staffProfile.findUnique({
      where: { id: profileId },
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
            company: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify profile belongs to company
    if (profile.membership.companyId !== companyId) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check permission (users can view their own profile)
    const canView =
      profile.membership.userId === session.id ||
      (await checkPermission(session.id, companyId, "staff:view"));

    if (!canView) {
      return NextResponse.json(
        { error: "No permission to view this profile" },
        { status: 403 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error("Get staff profile error", error, "Staff/Profiles");
    return NextResponse.json(
      { error: "Failed to fetch staff profile" },
      { status: 500 }
    );
  }
}

// Update staff profile
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
    const profileId = parseInt(id);

    if (isNaN(profileId)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      employmentStartDate,
      position,
      status,
      emergencyContactName,
      emergencyContactPhone,
      notes,
      performanceNotes,
    } = body;

    // Get existing profile
    const existingProfile = await prisma.staffProfile.findUnique({
      where: { id: profileId },
      include: {
        membership: {
          include: {
            company: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify profile belongs to company
    if (existingProfile.membership.companyId !== companyId) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check permission (users can edit their own basic info, but not performance notes)
    const canEdit =
      existingProfile.membership.userId === session.id ||
      (await checkPermission(session.id, companyId, "staff:edit"));

    if (!canEdit) {
      return NextResponse.json(
        { error: "No permission to edit this profile" },
        { status: 403 }
      );
    }

    // Only managers can edit performance notes
    if (performanceNotes !== undefined) {
      const canEditPerformance = await checkPermission(
        session.id,
        companyId,
        "staff:edit"
      );
      if (!canEditPerformance) {
        return NextResponse.json(
          { error: "No permission to edit performance notes" },
          { status: 403 }
        );
      }
    }

    const profile = await prisma.staffProfile.update({
      where: { id: profileId },
      data: {
        ...(employmentStartDate !== undefined && {
          employmentStartDate: employmentStartDate
            ? new Date(employmentStartDate)
            : null,
        }),
        ...(position !== undefined && { position }),
        ...(status !== undefined && { status }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
        ...(notes !== undefined && { notes }),
        ...(performanceNotes !== undefined && { performanceNotes }),
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

    return NextResponse.json({ profile });
  } catch (error) {
    logger.error("Update staff profile error", error, "Staff/Profiles");
    return NextResponse.json(
      { error: "Failed to update staff profile" },
      { status: 500 }
    );
  }
}

