import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth-simple";
import { logger } from "@/lib/logger";
import { generateDefaultCompanyName, generateCompanySlug } from "@/lib/company-defaults";
import { clearUserCache } from "@/lib/current";

/**
 * Admin endpoint to diagnose and fix membership issues
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    // Check if user is admin
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all memberships for this user
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const activeMemberships = memberships.filter(m => m.isActive);
    const inactiveMemberships = memberships.filter(m => !m.isActive);

    const diagnostics = {
      userId: user.id,
      email: user.email,
      name: user.name,
      totalMemberships: memberships.length,
      activeMemberships: activeMemberships.length,
      inactiveMemberships: inactiveMemberships.length,
      memberships: memberships.map(m => ({
        id: m.id,
        companyId: m.companyId,
        companyName: m.company.name,
        role: m.role,
        isActive: m.isActive,
        createdAt: m.createdAt,
      })),
    };

    // If action is 'fix', perform repairs
    if (action === 'fix') {
      const repairs: string[] = [];

      // Fix 1: Activate inactive memberships if user only has one company
      if (inactiveMemberships.length > 0 && activeMemberships.length === 0) {
        // Activate the first (oldest) membership
        const membershipToActivate = inactiveMemberships[0];
        await prisma.membership.update({
          where: { id: membershipToActivate.id },
          data: { isActive: true },
        });
        repairs.push(`Activated membership ${membershipToActivate.id} for company ${membershipToActivate.company.name}`);
        await clearUserCache(userId);
      }

      // Fix 2: Create company and membership if user has none
      if (memberships.length === 0) {
        const defaultCompanyName = generateDefaultCompanyName(user.email);
        const slug = await generateCompanySlug(defaultCompanyName);

        const result = await prisma.$transaction(async (tx) => {
          const company = await tx.company.create({
            data: {
              name: defaultCompanyName,
              slug,
              country: 'United Kingdom',
            },
          });

          const membership = await tx.membership.create({
            data: {
              userId,
              companyId: company.id,
              role: 'OWNER',
              isActive: true,
            },
          });

          return { company, membership };
        });

        repairs.push(`Created company "${result.company.name}" (ID: ${result.company.id}) and membership (ID: ${result.membership.id})`);
        await clearUserCache(userId);
      }

      logger.info(`Admin repair performed for user ${userId}`, {
        userId,
        repairs,
        performedBy: session.id,
      }, 'Admin');

      return NextResponse.json({
        success: true,
        diagnostics,
        repairs,
        message: repairs.length > 0 
          ? `Repaired ${repairs.length} issue(s)` 
          : 'No repairs needed',
      });
    }

    // Just return diagnostics
    return NextResponse.json({
      success: true,
      diagnostics,
      message: 'Diagnostics complete',
    });
  } catch (error) {
    logger.error('Error in fix-memberships endpoint', error, 'Admin');
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check system health
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    // Check if user is admin
    if (!session || !session.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

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

    return NextResponse.json({
      success: true,
      health: {
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
        },
      },
    });
  } catch (error) {
    logger.error('Error in fix-memberships GET endpoint', error, 'Admin');
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
