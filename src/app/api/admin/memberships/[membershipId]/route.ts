import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import bcrypt from "bcrypt";

// Get membership details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { membershipId: membershipIdParam } = await params;
    const membershipId = parseInt(membershipIdParam);
    if (isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid membership ID" }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    return NextResponse.json({ membership });
  } catch (error) {
    logger.error("Admin membership details error", error, "Admin/Memberships");
    return NextResponse.json(
      { error: "Failed to fetch membership details" },
      { status: 500 }
    );
  }
}

// Update membership (role, status, PIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { membershipId: membershipIdParam } = await params;
    const membershipId = parseInt(membershipIdParam);
    if (isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid membership ID" }, { status: 400 });
    }

    const body = await request.json();
    const { role, isActive, pin } = body;

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Handle PIN reset
    if (pin !== undefined) {
      if (pin === null || pin === "") {
        // Remove PIN
        updateData.pin = null;
        updateData.pinHash = null;
      } else {
        // Set new PIN
        if (!/^\d{4,6}$/.test(pin)) {
          return NextResponse.json(
            { error: "PIN must be 4-6 digits" },
            { status: 400 }
          );
        }

        // Check if PIN is already in use by another member in the same company
        const membership = await prisma.membership.findUnique({
          where: { id: membershipId },
          select: { companyId: true },
        });

        if (membership) {
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
        }

        updateData.pin = pin;
        updateData.pinHash = await bcrypt.hash(pin, 10);
      }
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
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
      membership: updated,
      pin: pin !== undefined && pin !== null ? pin : undefined, // Return PIN if set
    });
  } catch (error) {
    logger.error("Admin membership update error", error, "Admin/Memberships");
    return NextResponse.json(
      { error: "Failed to update membership" },
      { status: 500 }
    );
  }
}

// Remove user from company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { membershipId: membershipIdParam } = await params;
    const membershipId = parseInt(membershipIdParam);
    if (isNaN(membershipId)) {
      return NextResponse.json({ error: "Invalid membership ID" }, { status: 400 });
    }

    // Get membership to check if it's the owner
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    // Prevent deleting the last ADMIN (or OWNER for backward compatibility)
    if (membership.role === "ADMIN" || membership.role === "OWNER") {
      const adminCount = await prisma.membership.count({
        where: {
          companyId: membership.companyId,
          role: { in: ["ADMIN", "OWNER"] }, // Count both ADMIN and OWNER
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner of a company" },
          { status: 400 }
        );
      }
    }

    // Delete membership
    await prisma.membership.delete({
      where: { id: membershipId },
    });

    // Update company seat count
    await prisma.company.update({
      where: { id: membership.companyId },
      data: { seatsUsed: { decrement: 1 } },
    });

    return NextResponse.json({ 
      success: true, 
      message: "User removed from company successfully" 
    });
  } catch (error) {
    logger.error("Admin membership delete error", error, "Admin/Memberships");
    return NextResponse.json(
      { error: "Failed to remove user from company" },
      { status: 500 }
    );
  }
}

