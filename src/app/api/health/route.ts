import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Health check endpoint
 * Checks database connectivity and system health
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Count orphaned users (users with no memberships)
    const totalUsers = await prisma.user.count();
    const usersWithMemberships = await prisma.user.count({
      where: {
        memberships: {
          some: {},
        },
      },
    });
    const orphanedUsers = totalUsers - usersWithMemberships;

    // Count users with inactive memberships but no active ones
    const usersWithOnlyInactive = await prisma.user.count({
      where: {
        memberships: {
          some: {
            isActive: false,
          },
          none: {
            isActive: true,
          },
        },
      },
    });

    // Count total memberships
    const totalMemberships = await prisma.membership.count();
    const activeMemberships = await prisma.membership.count({
      where: { isActive: true },
    });
    const inactiveMemberships = totalMemberships - activeMemberships;

    const health = {
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      users: {
        total: totalUsers,
        withMemberships: usersWithMemberships,
        orphaned: orphanedUsers,
        withOnlyInactive: usersWithOnlyInactive,
      },
      memberships: {
        total: totalMemberships,
        active: activeMemberships,
        inactive: inactiveMemberships,
      },
      issues: {
        orphanedUsers,
        usersWithOnlyInactive,
        hasIssues: orphanedUsers > 0 || usersWithOnlyInactive > 0,
      },
    };

    // Return 503 if there are critical issues
    const statusCode = health.issues.hasIssues ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', error, 'Health');
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 }
    );
  }
}
