import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/permissions";
import { updateSubscriptionSeats } from "@/lib/stripe";
import { auditLog } from "@/lib/audit-log";

// Get team members
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }

    // Check if user has access to this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No access to this company" }, { status: 403 });
    }

    // Get all members
    const members = await prisma.membership.findMany({
      where: { companyId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get pending invitations
    const invitations = await prisma.teamInvitation.findMany({
      where: { 
        companyId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ members, invitations });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get team members" },
      { status: 500 }
    );
  }
}

// Update member role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { membershipId, role, companyId } = body;

    if (!membershipId || !role || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Get existing membership for validation and audit
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    }

    // Don't allow removing the last owner
    if (role !== 'OWNER' && membership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId, role: 'OWNER', isActive: true },
      });
      
      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: "Cannot change role of the last owner" 
        }, { status: 400 });
      }
    }

    // Get old role for audit
    const oldRole = membership.role;

    // Update role
    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { role },
    });

    // Audit role change
    await auditLog.roleChanged(
      session.id,
      updated.userId,
      oldRole,
      role,
      companyId
    );

    return NextResponse.json({ success: true, membership: updated });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// Remove team member
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const membershipId = parseInt(searchParams.get('membershipId') || '0');
    const companyId = parseInt(searchParams.get('companyId') || '0');

    if (!membershipId || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has permission to manage team
    const canManage = await checkPermission(session.id, companyId, "manage:team");
    if (!canManage) {
      return NextResponse.json({ error: "No permission to manage team" }, { status: 403 });
    }

    // Don't allow removing the last owner
    const membership = await prisma.membership.findUnique({
      where: { id: membershipId },
    });
    
    if (membership?.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId, role: 'OWNER', isActive: true },
      });
      
      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: "Cannot remove the last owner" 
        }, { status: 400 });
      }
    }

    // Get company owner's subscription to update billing
    const ownerMembership = await prisma.membership.findFirst({
      where: { 
        companyId,
        role: "OWNER",
        isActive: true,
      },
    });

    if (ownerMembership) {
      const ownerSubscription = await prisma.subscription.findUnique({
        where: { userId: ownerMembership.userId },
      });

      if (ownerSubscription?.stripeSubscriptionId) {
        // Calculate new seat count after removal
        const remainingActiveMembers = await prisma.membership.count({
          where: { 
            companyId,
            isActive: true,
          },
        });

        const additionalSeatsNeeded = Math.max(0, remainingActiveMembers - 1); // -1 for base seat

        try {
          await updateSubscriptionSeats(
            ownerSubscription.stripeSubscriptionId,
            1, // base seats
            additionalSeatsNeeded
          );
        } catch (stripeError) {
          console.error("Failed to update Stripe subscription:", stripeError);
          // Continue with removal even if Stripe update fails
        }
      }
    }

    // Get member info for audit
    const memberToRemove = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { user: { select: { email: true } } },
    });

    // Soft delete (set isActive to false)
    await prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });

    // Update company seat count
    await prisma.company.update({
      where: { id: companyId },
      data: { seatsUsed: { decrement: 1 } },
    });

    // Audit member removal
    if (memberToRemove) {
      await auditLog.memberRemoved(
        session.id,
        memberToRemove.userId,
        memberToRemove.user.email,
        companyId
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 }
    );
  }
}

