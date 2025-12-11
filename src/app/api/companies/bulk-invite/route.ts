import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions";
import crypto from "crypto";

/**
 * Bulk invite team members via CSV
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
    const { companyId, emails, role, customMessage } = body;

    if (!companyId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Company ID and emails array are required" },
        { status: 400 }
      );
    }

    // Verify user has permission
    const canManage = await checkPermission(session.id, companyId, "team:manage");
    if (!canManage) {
      return NextResponse.json(
        { error: "No permission to manage team" },
        { status: 403 }
      );
    }

    // Check company seat limits
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        memberships: {
          where: { isActive: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const currentSeats = company.memberships.length;
    const availableSeats = company.maxSeats - currentSeats;

    if (emails.length > availableSeats) {
      return NextResponse.json(
        { 
          error: `Only ${availableSeats} seat(s) available. You're trying to invite ${emails.length} people.`,
          availableSeats,
          requestedSeats: emails.length,
        },
        { status: 400 }
      );
    }

    // Create invitations
    const invitations = [];
    const errors = [];

    for (const email of emails) {
      try {
        // Check if invitation already exists
        const existing = await prisma.teamInvitation.findUnique({
          where: {
            companyId_email: {
              companyId,
              email: email.toLowerCase().trim(),
            },
          },
        });

        if (existing) {
          if (existing.acceptedAt) {
            errors.push({ email, error: "Already a member" });
          } else {
            errors.push({ email, error: "Invitation already sent" });
          }
          continue;
        }

        // Check if user is already a member
        const user = await prisma.user.findUnique({
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

        if (user && user.memberships.length > 0) {
          errors.push({ email, error: "Already a member" });
          continue;
        }

        // Create invitation
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

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

        invitations.push(invitation);

        // TODO: Send invitation email
        logger.info(`Bulk invitation created`, {
          companyId,
          email: email.toLowerCase().trim(),
          invitedBy: session.id,
        }, "Companies");
      } catch (error) {
        logger.error(`Failed to create invitation for ${email}`, error, "Companies");
        errors.push({ email, error: "Failed to create invitation" });
      }
    }

    return NextResponse.json({
      success: true,
      invitations: invitations.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${invitations.length} invitation(s)${errors.length > 0 ? `, ${errors.length} failed` : ""}`,
    });
  } catch (error) {
    logger.error("Error in bulk invite", error, "Companies");
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}
