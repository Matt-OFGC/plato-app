import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@/generated/prisma";
import crypto from "crypto";

/**
 * Create a team member directly (for PIN-based authentication)
 * This creates a user account without password and adds them to the company
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, role, companyId } = body;

    if (!name || !email || !role || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Check if company has reached seat limit
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { 
        memberships: {
          where: { isActive: true }
        }
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const currentActiveMembers = company.memberships.length;
    const maxSeats = company.maxSeats;

    if (currentActiveMembers >= maxSeats) {
      return NextResponse.json({ 
        error: `Maximum seats (${maxSeats}) reached. Please upgrade your plan to add more team members.` 
      }, { status: 400 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Check if they already have membership in this company
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId,
          },
        },
      });

      if (existingMembership) {
        return NextResponse.json({ 
          error: "User is already a member of this company" 
        }, { status: 400 });
      }
    } else {
      // Create new user without password (PIN-only access)
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: null, // No password - PIN-only access
        },
      });
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        companyId,
        role: role as MemberRole,
        invitedBy: session.id,
        acceptedAt: new Date(), // Immediately accepted since created directly
        isActive: true,
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
      message: "Team member added successfully. Now assign them a PIN.",
    });
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}

