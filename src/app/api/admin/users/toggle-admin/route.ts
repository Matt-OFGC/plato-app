import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Toggle system admin status for a user
 * 
 * SECURITY: Only existing system admins can grant/revoke system admin status
 * This endpoint requires system admin authentication via getAdminSession()
 * 
 * System admin status is separate from company-level permissions:
 * - System admin: Access to /system-admin/* backend
 * - Company admin: Controlled by membership.role (ADMIN, MANAGER, STAFF)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify requester is a system admin
    const session = await getAdminSession();
    if (!session) {
      logger.warn("Unauthorized attempt to toggle admin status", {
        ip: request.headers.get('x-forwarded-for'),
        timestamp: new Date(),
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, isAdmin } = body;

    if (typeof userId !== 'number' || typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: "userId (number) and isAdmin (boolean) are required" },
        { status: 400 }
      );
    }

    // Prevent self-demotion (safety check)
    if (session.userId === userId && isAdmin === false) {
      return NextResponse.json(
        { error: "Cannot remove your own admin status" },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isAdmin: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Cannot change admin status for inactive user" },
        { status: 400 }
      );
    }

    // Update admin status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        name: true,
      },
    });

    // Log the action
    logger.info("System admin status changed", {
      changedBy: session.email,
      changedByUserId: session.userId,
      targetUserId: userId,
      targetEmail: user.email,
      newStatus: isAdmin,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: isAdmin 
        ? `User ${updatedUser.email} is now a system admin`
        : `System admin status removed from ${updatedUser.email}`,
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Toggle admin status error", error, "Admin/ToggleAdmin");
    return NextResponse.json(
      { error: "Failed to toggle admin status" },
      { status: 500 }
    );
  }
}

