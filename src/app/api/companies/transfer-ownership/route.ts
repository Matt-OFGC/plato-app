import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";
import { auditLog } from "@/lib/audit-log";

/**
 * Transfer company ownership to another member
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
    const { companyId, newOwnerMembershipId, confirmPassword } = body;

    if (!companyId || !newOwnerMembershipId) {
      return NextResponse.json(
        { error: "Company ID and new owner membership ID are required" },
        { status: 400 }
      );
    }

    // Verify current user is the owner
    const currentMembership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
    });

    if (!currentMembership || currentMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the company owner can transfer ownership" },
        { status: 403 }
      );
    }

    // Verify new owner membership exists and belongs to this company
    const newOwnerMembership = await prisma.membership.findUnique({
      where: { id: newOwnerMembershipId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!newOwnerMembership || newOwnerMembership.companyId !== companyId) {
      return NextResponse.json(
        { error: "Invalid membership or membership doesn't belong to this company" },
        { status: 400 }
      );
    }

    if (!newOwnerMembership.isActive) {
      return NextResponse.json(
        { error: "Cannot transfer ownership to an inactive member" },
        { status: 400 }
      );
    }

    // If password confirmation is required, verify it
    if (confirmPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { passwordHash: true },
      });

      if (user?.passwordHash) {
        const bcrypt = await import("bcrypt");
        const isValid = await bcrypt.compare(confirmPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid password confirmation" },
            { status: 401 }
          );
        }
      }
    }

    // Transfer ownership in a transaction
    await prisma.$transaction(async (tx) => {
      // Update current owner to ADMIN
      await tx.membership.update({
        where: { id: currentMembership.id },
        data: { role: "ADMIN" },
      });

      // Update new owner to OWNER
      await tx.membership.update({
        where: { id: newOwnerMembershipId },
        data: { role: "OWNER" },
      });

      // Update company ownerId if field exists
      try {
        await tx.company.update({
          where: { id: companyId },
          data: { ownerId: newOwnerMembership.userId },
        });
      } catch (error) {
        // ownerId field might not exist, that's OK
        logger.debug("Could not update company ownerId field", { error }, "Companies");
      }
    });

    // Clear caches
    await clearUserCache(session.id);
    await clearUserCache(newOwnerMembership.userId);

    // Audit the transfer
    await auditLog.companyUpdated(
      session.id,
      companyId,
      {
        action: "transfer_ownership",
        fromUserId: session.id,
        toUserId: newOwnerMembership.userId,
        toUserEmail: newOwnerMembership.user.email,
      }
    );

    logger.info(`Company ownership transferred`, {
      companyId,
      fromUserId: session.id,
      toUserId: newOwnerMembership.userId,
    }, "Companies");

    return NextResponse.json({
      success: true,
      message: `Ownership transferred to ${newOwnerMembership.user.name || newOwnerMembership.user.email}`,
    });
  } catch (error) {
    logger.error("Error transferring company ownership", error, "Companies");
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}
