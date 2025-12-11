import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import crypto from "crypto";

/**
 * Create collaboration invitation (external company/user)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { companyId, email, role, message, expiresInDays = 7 } = body;

    if (!companyId || !email) {
      return NextResponse.json(
        { error: "Company ID and email are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "team:manage");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to create collaboration invitations" },
        { status: 403 }
      );
    }

    // Check if user already has membership
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: {
            companyId,
            isActive: true,
          },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this company" },
        { status: 400 }
      );
    }

    // Check for existing invitation
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: {
        companyId_email: {
          companyId,
          email: email.toLowerCase().trim(),
        },
      },
    });

    if (existingInvitation && !existingInvitation.acceptedAt) {
      if (existingInvitation.expiresAt && existingInvitation.expiresAt > new Date()) {
        return NextResponse.json(
          { error: "Invitation already sent and still valid" },
          { status: 400 }
        );
      }
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await prisma.teamInvitation.create({
      data: {
        companyId,
        email: email.toLowerCase().trim(),
        role: role || "EMPLOYEE",
        invitedBy: session.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send invitation email
    logger.info(`Collaboration invitation created`, {
      companyId,
      email: email.toLowerCase().trim(),
      invitedBy: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
      message: "Invitation sent successfully",
    });
  } catch (error) {
    logger.error("Error creating collaboration invitation", error, "Companies");
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
