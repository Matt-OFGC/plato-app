import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { MemberRole } from "@/generated/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, companyId } = body;

    if (!email || !role || !companyId) {
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
      include: { memberships: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (company.memberships.length >= company.maxSeats) {
      return NextResponse.json({ 
        error: `Maximum seats (${company.maxSeats}) reached. Please upgrade your plan.` 
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

    // TODO: Send invitation email
    const inviteUrl = `${request.nextUrl.origin}/invite/${token}`;
    console.log(`Invitation URL: ${inviteUrl}`);

    return NextResponse.json({ 
      success: true,
      invitation,
      inviteUrl, // For now, return the URL (later send via email)
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

