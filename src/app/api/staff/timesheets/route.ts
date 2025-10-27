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
      where.clockInAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    
    if (membershipId) {
      where.membershipId = parseInt(membershipId);
    }
    
    if (status) {
      where.status = status;
    }

    const timesheets = await prisma.timesheet.findMany({
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
        shift: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            shiftType: true,
          },
        },
      },
      orderBy: { clockInAt: 'desc' },
    });

    return NextResponse.json({ timesheets });
  } catch (error) {
    console.error("Get timesheets error:", error);
    return NextResponse.json(
      { error: "Failed to get timesheets" },
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
      action, // "clock_in" or "clock_out"
      membershipId,
      shiftId,
      notes,
      location,
      ipAddress,
      breakStart,
      breakEnd,
    } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action required (clock_in or clock_out)" },
        { status: 400 }
      );
    }

    // For clock in, we need to know which membership
    if (action === "clock_in" && !membershipId) {
      return NextResponse.json(
        { error: "Membership ID required for clock in" },
        { status: 400 }
      );
    }

    if (action === "clock_out") {
      // Find active timesheet (clocked in but not clocked out)
      const activeTimesheet = await prisma.timesheet.findFirst({
        where: {
          companyId,
          membershipId,
          clockOutAt: null,
          status: "pending",
        },
        orderBy: { clockInAt: 'desc' },
      });

      if (!activeTimesheet) {
        return NextResponse.json(
          { error: "No active clock-in found" },
          { status: 400 }
        );
      }

      const now = new Date();
      const clockInTime = new Date(activeTimesheet.clockInAt);
      
      // Calculate hours worked
      let breakMinutes = 0;
      let totalHours = 0;
      
      if (activeTimesheet.breakStart && activeTimesheet.breakEnd) {
        const breakStart = new Date(activeTimesheet.breakStart);
        const breakEnd = new Date(activeTimesheet.breakEnd);
        breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      }

      const totalMinutes = (now.getTime() - clockInTime.getTime()) / (1000 * 60);
      totalHours = (totalMinutes - breakMinutes) / 60;

      const updatedTimesheet = await prisma.timesheet.update({
        where: { id: activeTimesheet.id },
        data: {
          clockOutAt: now,
          totalHours,
          breakHours: breakMinutes / 60,
          clockOutLocation: location || "unknown",
          clockOutIp: ipAddress,
          notes: notes || activeTimesheet.notes,
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

      return NextResponse.json({ timesheet: updatedTimesheet });
    } else {
      // Clock in
      const now = new Date();

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

      // Check for existing active clock-in
      const existingClockIn = await prisma.timesheet.findFirst({
        where: {
          membershipId,
          clockOutAt: null,
        },
      });

      if (existingClockIn) {
        return NextResponse.json(
          { error: "Already clocked in. Please clock out first." },
          { status: 400 }
        );
      }

      const timesheet = await prisma.timesheet.create({
        data: {
          membershipId,
          companyId,
          clockInAt: now,
          shiftId,
          clockInLocation: location || "unknown",
          clockInIp: ipAddress,
          notes,
          breakStart: breakStart ? new Date(breakStart) : null,
          breakEnd: breakEnd ? new Date(breakEnd) : null,
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

      return NextResponse.json({ timesheet }, { status: 201 });
    }
  } catch (error) {
    console.error("Clock in/out error:", error);
    return NextResponse.json(
      { error: "Failed to clock in/out" },
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
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Timesheet ID required" },
        { status: 400 }
      );
    }

    // Verify timesheet belongs to company
    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id, companyId },
    });

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: "Timesheet not found" },
        { status: 404 }
      );
    }

    const data: any = { ...updates };
    
    // Handle approval/rejection
    if (action === "approve") {
      data.status = "approved";
      data.approvedBy = session.id;
      data.approvedAt = new Date();
    } else if (action === "reject") {
      data.status = "rejected";
      data.approvedBy = session.id;
      data.approvedAt = new Date();
      if (!data.rejectionReason) {
        return NextResponse.json(
          { error: "Rejection reason required" },
          { status: 400 }
        );
      }
    }

    // Recalculate hours if clock times changed
    if (data.clockInAt || data.clockOutAt) {
      const clockIn = new Date(data.clockInAt || existingTimesheet.clockInAt);
      const clockOut = new Date(data.clockOutAt || existingTimesheet.clockOutAt || new Date());
      
      let breakMinutes = 0;
      if (data.breakStart || data.breakEnd || existingTimesheet.breakStart) {
        const breakStart = new Date(data.breakStart || existingTimesheet.breakStart || new Date());
        const breakEnd = new Date(data.breakEnd || existingTimesheet.breakEnd || new Date());
        breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
      }
      
      const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60);
      data.totalHours = (totalMinutes - breakMinutes) / 60;
      data.breakHours = breakMinutes / 60;
      
      // Update timestamps
      if (data.clockInAt) data.clockInAt = new Date(data.clockInAt);
      if (data.clockOutAt) data.clockOutAt = new Date(data.clockOutAt);
    }

    const timesheet = await prisma.timesheet.update({
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

    return NextResponse.json({ timesheet });
  } catch (error) {
    console.error("Update timesheet error:", error);
    return NextResponse.json(
      { error: "Failed to update timesheet" },
      { status: 500 }
    );
  }
}
