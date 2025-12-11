import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const { membershipId, newPin } = body;

    if (!membershipId) {
      return NextResponse.json(
        { error: "Membership ID is required" },
        { status: 400 }
      );
    }

    // Validate PIN format (4-6 digits)
    const pin = newPin || Math.floor(1000 + Math.random() * 9000).toString(); // Generate random 4-digit PIN if not provided
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    // Check if membership exists and belongs to a company
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // Check if PIN is already in use by another member in the same company
    const existingPin = await prisma.membership.findFirst({
      where: {
        companyId: membership.companyId,
        pin,
        id: { not: membershipId },
        isActive: true,
      },
    });

    if (existingPin) {
      return NextResponse.json(
        { error: "PIN already in use by another team member" },
        { status: 400 }
      );
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Update membership with new PIN
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: {
        pin,
        pinHash,
      },
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
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pin, // Return plain PIN so admin can see it
      message: `PIN reset successfully for ${updated.user.email} in ${updated.company.name}`,
      membership: {
        id: updated.id,
        userId: updated.userId,
        companyId: updated.companyId,
        userEmail: updated.user.email,
        companyName: updated.company.name,
      },
    });
  } catch (error) {
    logger.error("Admin PIN reset error", error, "Admin/Users");
    return NextResponse.json(
      { error: "Failed to reset PIN" },
      { status: 500 }
    );
  }
}

// Get all PINs for a user (across all their memberships)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const pins = memberships.map((m) => ({
      membershipId: m.id,
      companyId: m.company.id,
      companyName: m.company.name,
      pin: m.pin || null,
      hasPin: !!m.pin,
      role: m.role,
      isActive: m.isActive,
    }));

    return NextResponse.json({ pins });
  } catch (error) {
    logger.error("Admin get PINs error", error, "Admin/Users");
    return NextResponse.json(
      { error: "Failed to fetch PINs" },
      { status: 500 }
    );
  }
}

