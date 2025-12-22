import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MemberRole } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { getInvitationMetadata, deleteInvitationMetadata } from "@/lib/invitation-metadata-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userEmail } = body;

    if (!token || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
    }

    if (invitation.email !== userEmail) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ 
        error: "User account not found. Please create an account first." 
      }, { status: 404 });
    }

    // Check if user already has membership
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: invitation.companyId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ 
        error: "User is already a member of this company" 
      }, { status: 400 });
    }

    // Get invitation metadata (for staffPermissions if STAFF role)
    const metadata = getInvitationMetadata(invitation.id);
    const staffPermissions = metadata?.staffPermissions;

    // Create the membership with staffPermissions if STAFF role
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        companyId: invitation.companyId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
        isActive: true,
        staffPermissions: invitation.role === "STAFF" && staffPermissions ? staffPermissions : null,
      },
    });

    // Clean up metadata after use
    if (metadata) {
      deleteInvitationMetadata(invitation.id);
    }

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return NextResponse.json({ 
      success: true,
      membership,
      company: invitation.company,
    });
  } catch (error) {
    logger.error("Accept invitation error", error, "Team/Accept");
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

