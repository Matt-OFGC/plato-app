import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/generated/prisma";
import { logger } from "@/lib/logger";

// Add user to company (admin function)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId: companyIdParam } = await params;
    const companyId = parseInt(companyIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, email, name, role = "VIEWER" } = body;

    // Validate role
    const validRoles: MemberRole[] = ["OWNER", "ADMIN", "EDITOR", "VIEWER"];
    if (!validRoles.includes(role as MemberRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        memberships: {
          where: { isActive: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check seat limit
    if (company.memberships.length >= company.maxSeats) {
      return NextResponse.json(
        { error: `Company has reached maximum seats (${company.maxSeats})` },
        { status: 400 }
      );
    }

    let user;
    
    // Find or create user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Create new user without password (PIN-only)
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split("@")[0],
            passwordHash: null, // PIN-only access
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: "Either userId or email is required" },
        { status: 400 }
      );
    }

    // Check if user already has membership in this company
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });

    if (existingMembership) {
      // Reactivate if inactive
      if (!existingMembership.isActive) {
        const reactivated = await prisma.membership.update({
          where: { id: existingMembership.id },
          data: { isActive: true, role: role as MemberRole },
        });
        return NextResponse.json({ 
          success: true, 
          membership: reactivated,
          message: "User reactivated in company" 
        });
      }
      return NextResponse.json(
        { error: "User is already a member of this company" },
        { status: 400 }
      );
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        companyId,
        role: role as MemberRole,
        isActive: true,
        acceptedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Update company seat count
    await prisma.company.update({
      where: { id: companyId },
      data: { seatsUsed: { increment: 1 } },
    });

    return NextResponse.json({ 
      success: true, 
      membership,
      message: "User added to company successfully" 
    });
  } catch (error) {
    logger.error("Admin add member error", error, "Admin/Companies");
    return NextResponse.json(
      { error: "Failed to add user to company" },
      { status: 500 }
    );
  }
}

