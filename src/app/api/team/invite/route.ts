import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@/generated/prisma";
import { sendTeamInviteEmail } from "@/lib/email";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { storeInvitationMetadata } from "@/lib/invitation-metadata-store";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      email, 
      name,
      role, 
      companyId,
      staffPermissions, // { canEditIngredients?: boolean, canEditRecipes?: boolean }
    } = body;

    if (!email || !role || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["ADMIN", "MANAGER", "STAFF"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(", ")}` 
      }, { status: 400 });
    }

    // Validate staffPermissions if role is STAFF
    if (role === "STAFF" && staffPermissions) {
      if (typeof staffPermissions !== "object") {
        return NextResponse.json({ 
          error: "staffPermissions must be an object" 
        }, { status: 400 });
      }
      const perms = staffPermissions as { canEditIngredients?: boolean; canEditRecipes?: boolean };
      if (perms.canEditIngredients !== undefined && typeof perms.canEditIngredients !== "boolean") {
        return NextResponse.json({ 
          error: "canEditIngredients must be a boolean" 
        }, { status: 400 });
      }
      if (perms.canEditRecipes !== undefined && typeof perms.canEditRecipes !== "boolean") {
        return NextResponse.json({ 
          error: "canEditRecipes must be a boolean" 
        }, { status: 400 });
      }
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "team:manage");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if user already has membership
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { companyId },
        },
      },
    });

    if (existingUser?.memberships.length) {
      return NextResponse.json({ 
        error: "User is already a member of this company" 
      }, { status: 400 });
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.teamInvitation.findUnique({
      where: {
        companyId_email: {
          companyId,
          email,
        },
      },
    });

    if (existingInvite && !existingInvite.acceptedAt) {
      return NextResponse.json({ 
        error: "Invitation already sent to this email" 
      }, { status: 400 });
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.teamInvitation.create({
      data: {
        companyId,
        email,
        role: role as MemberRole,
        invitedBy: session.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Get inviter info for email
    const inviter = await prisma.user.findUnique({
      where: { id: session.id },
    });

    const inviteUrl = `${request.nextUrl.origin}/invite/${token}`;
    
    // Send invitation email
    try {
      await sendTeamInviteEmail({
        to: email,
        inviterName: inviter?.name || inviter?.email || "Someone",
        companyName: company.name,
        inviteLink: inviteUrl,
      });
      logger.info(`Invitation email sent to ${email}`, { email, companyId }, "Team/Invite");
    } catch (emailError) {
      logger.error("Failed to send invitation email", emailError, "Team/Invite");
      // Don't fail the invitation if email fails - they still have the URL
    }

    // Store staffPermissions metadata for STAFF role (will be used when invitation is accepted)
    if (role === "STAFF" && staffPermissions) {
      storeInvitationMetadata(invitation.id, { staffPermissions });
    }
    
    // Don't expose the full invitation object or token in response
    return NextResponse.json({ 
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      // Note: inviteUrl is sent via email, not returned in API response for security
    });
  } catch (error) {
    logger.error("Invite error", error, "Team/Invite");
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

