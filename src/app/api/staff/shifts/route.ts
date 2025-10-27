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
      where.date = {
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

    const shifts = await prisma.shift.findMany({
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
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error("Get shifts error:", error);
    return NextResponse.json(
      { error: "Failed to get shifts" },
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
      date,
      startTime,
      endTime,
      breakDuration,
      shiftType,
      location,
      status,
      notes,
      productionPlanId,
    } = body;

    if (!membershipId || !date || !startTime || !endTime) {
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

    const shift = await prisma.shift.create({
      data: {
        membershipId,
        companyId,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        breakDuration: breakDuration || 0,
        shiftType: shiftType || "general",
        location,
        status: status || "scheduled",
        notes,
        productionPlanId,
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

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error("Create shift error:", error);
    return NextResponse.json(
      { error: "Failed to create shift" },
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Shift ID required" },
        { status: 400 }
      );
    }

    // Verify shift belongs to company
    const existingShift = await prisma.shift.findUnique({
      where: { id, companyId },
    });

    if (!existingShift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    // Update date/times if provided
    const data: any = { ...updates };
    if (data.date) data.date = new Date(data.date);
    if (data.startTime) data.startTime = new Date(data.startTime);
    if (data.endTime) data.endTime = new Date(data.endTime);

    const shift = await prisma.shift.update({
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

    return NextResponse.json({ shift });
  } catch (error) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "Failed to update shift" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await getCurrentUserAndCompany();
    
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json(
        { error: "Shift ID required" },
        { status: 400 }
      );
    }

    // Verify shift belongs to company
    const shift = await prisma.shift.findUnique({
      where: { id, companyId },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shift error:", error);
    return NextResponse.json(
      { error: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
