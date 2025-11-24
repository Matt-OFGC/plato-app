import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "@/lib/current";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const membershipId = searchParams.get('membershipId');
    const status = searchParams.get('status');

    // Build filter
    const where: any = { companyId };
    
    if (startDate && endDate) {
      where.startDate = {
        lte: new Date(endDate),
      };
      where.endDate = {
        gte: new Date(startDate),
      };
    }
    
    if (membershipId) {
      where.membershipId = parseInt(membershipId);
    }
    
    if (status) {
      where.status = status;
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
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
      orderBy: { startDate: 'asc' },
    });

    return createOptimizedResponse({ leaveRequests }, {
      cacheType: 'dynamic',
      compression: true,
    });
  } catch (error) {
    logger.error("Get leave requests error", error, "Staff/Leave");
    return NextResponse.json(
      { error: "Failed to get leave requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const {
      membershipId,
      leaveType,
      startDate,
      endDate,
      isFullDay,
      startTime,
      endTime,
      reason,
      notes,
    } = body;

    if (!membershipId || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Invalid membership" },
        { status: 404 }
      );
    }

    // Check for overlapping leave requests
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        membershipId,
        companyId,
        status: {
          in: ["pending", "approved"],
        },
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) },
          },
        ],
      },
    });

    if (overlappingLeave) {
      return NextResponse.json(
        { error: "Overlapping leave request already exists" },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        membershipId,
        companyId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isFullDay: isFullDay !== false,
        startTime: isFullDay === false ? startTime : null,
        endTime: isFullDay === false ? endTime : null,
        reason,
        notes,
        status: "pending",
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

    return NextResponse.json({ leaveRequest }, { status: 201 });
  } catch (error) {
    logger.error("Create leave request error", error, "Staff/Leave");
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const body = await request.json();
    const { id, action, reviewNotes, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Leave request ID required" },
        { status: 400 }
      );
    }

    // Verify leave request belongs to company
    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id, companyId },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    const data: any = { ...updates };
    
    // Handle approval/rejection
    if (action === "approve") {
      data.status = "approved";
      data.reviewedBy = session.id;
      data.reviewedAt = new Date();
      if (reviewNotes) data.reviewNotes = reviewNotes;
    } else if (action === "reject") {
      data.status = "rejected";
      data.reviewedBy = session.id;
      data.reviewedAt = new Date();
      if (reviewNotes) data.reviewNotes = reviewNotes;
    } else if (action === "cancel") {
      data.status = "cancelled";
    }

    // Update dates if provided
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data,
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

    return NextResponse.json({ leaveRequest });
  } catch (error) {
    console.error("Update leave request error:", error);
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}
