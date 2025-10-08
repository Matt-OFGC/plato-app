import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateSubscriptionSeats } from "@/lib/stripe";
import { MemberRole } from "@/generated/prisma";

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

    // Get the company owner's subscription to update billing
    const ownerMembership = await prisma.membership.findFirst({
      where: { 
        companyId: invitation.companyId,
        role: "OWNER",
        isActive: true,
      },
      include: { user: true },
    });

    if (!ownerMembership) {
      return NextResponse.json({ 
        error: "Company owner not found" 
      }, { status: 404 });
    }

    const ownerSubscription = await prisma.subscription.findUnique({
      where: { userId: ownerMembership.userId },
    });

    if (!ownerSubscription || ownerSubscription.status !== 'active') {
      return NextResponse.json({ 
        error: "Company subscription not active" 
      }, { status: 400 });
    }

    // Calculate new seat count
    const currentMembers = await prisma.membership.count({
      where: { 
        companyId: invitation.companyId,
        isActive: true,
      },
    });

    const additionalSeatsNeeded = Math.max(0, currentMembers + 1 - 1); // +1 for new member, -1 for base seat

    // Update Stripe subscription if additional seats needed
    if (additionalSeatsNeeded > 0 && ownerSubscription.stripeSubscriptionId) {
      try {
        await updateSubscriptionSeats(
          ownerSubscription.stripeSubscriptionId,
          1, // base seats
          additionalSeatsNeeded
        );
      } catch (stripeError) {
        console.error("Failed to update Stripe subscription:", stripeError);
        return NextResponse.json({ 
          error: "Failed to update billing. Please contact support." 
        }, { status: 500 });
      }
    }

    // Create the membership
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        companyId: invitation.companyId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
        isActive: true,
      },
    });

    // Mark invitation as accepted
    await prisma.teamInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    // Update company seat count
    await prisma.company.update({
      where: { id: invitation.companyId },
      data: { seatsUsed: { increment: 1 } },
    });

    return NextResponse.json({ 
      success: true,
      membership,
      company: invitation.company,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

