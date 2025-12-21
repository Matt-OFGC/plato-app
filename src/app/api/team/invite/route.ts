import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@/generated/prisma";
import { updateSubscriptionSeats } from "@/lib/stripe";
import { sendTeamInviteEmail } from "@/lib/email";
import crypto from "crypto";
import { canInviteTeamMembers, createFeatureGateError } from "@/lib/subscription";
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
      // Staff profile fields
      position,
      phone,
      employmentStartDate,
      emergencyContactName,
      emergencyContactPhone,
      notes,
    } = body;

    if (!email || !role || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Check if user has access to team features
    const hasTeamAccess = await canInviteTeamMembers(session.id);
    if (!hasTeamAccess) {
      return NextResponse.json(
        createFeatureGateError("teams", "Team Collaboration"),
        { status: 403 }
      );
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

    // Get current subscription to check seat limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.id },
    });

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ 
        error: "Active subscription required to invite team members" 
      }, { status: 400 });
    }

    // Calculate current seat usage and limits
    const currentActiveMembers = company.memberships.length;
    const maxSeats = company.maxSeats;

    if (currentActiveMembers >= maxSeats) {
      return NextResponse.json({ 
        error: `Maximum seats (${maxSeats}) reached. Please upgrade your plan to add more team members.` 
      }, { status: 400 });
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

    // Store staff profile data - we'll create the profile when invitation is accepted
    // For MVP, store this data temporarily. We'll create the staff profile in the accept endpoint
    // If staffProfile model exists, create it after membership is created
    // Store profile data in invitation metadata or handle in accept endpoint

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

    // Note: We don't update Stripe subscription here because the user hasn't accepted yet
    // The subscription will be updated when they accept the invitation

    // Store staff profile metadata for later use when invitation is accepted
    const profileData = {
      name: name || null,
      position: position || null,
      phone: phone || null,
      employmentStartDate: employmentStartDate || null,
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      notes: notes || null,
    };

    // Store metadata in memory (will be used when invitation is accepted)
    storeInvitationMetadata(invitation.id, profileData);
    
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

