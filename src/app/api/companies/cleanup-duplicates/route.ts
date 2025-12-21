import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";

/**
 * Cleanup duplicate companies for the current user
 * Keeps the company with the most data (recipes/ingredients) and archives the rest
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keepCompanyId, deleteCompanyIds } = body;

    if (!keepCompanyId || !Array.isArray(deleteCompanyIds) || deleteCompanyIds.length === 0) {
      return NextResponse.json(
        { error: "keepCompanyId and deleteCompanyIds array are required" },
        { status: 400 }
      );
    }

    // Verify user has access to all companies (keep and delete)
    // Check both active and inactive memberships to catch all duplicates
    const memberships = await prisma.membership.findMany({
      where: {
        userId: user.id,
        companyId: { in: [keepCompanyId, ...deleteCompanyIds] },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: {
              select: {
                recipes: true,
                ingredients: true,
                memberships: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    logger.debug(`Found ${memberships.length} memberships for cleanup`, {
      userId: user.id,
      keepCompanyId,
      deleteCompanyIds,
      foundMemberships: memberships.map(m => ({ companyId: m.companyId, role: m.role, isActive: m.isActive })),
    }, "Companies");

    // Check user has ADMIN/OWNER access to the company they want to keep
    const keepMembership = memberships.find(m => m.companyId === keepCompanyId);
    if (!keepMembership) {
      return NextResponse.json(
        { error: `You don't have access to the company you want to keep (ID: ${keepCompanyId})` },
        { status: 403 }
      );
    }
    const keepRoleUpper = keepMembership.role.toUpperCase();
    if (keepRoleUpper !== "OWNER" && keepRoleUpper !== "ADMIN") {
      return NextResponse.json(
        { error: `You must be ADMIN or OWNER of the company you want to keep. Your role is ${keepMembership.role}.` },
        { status: 403 }
      );
    }

    // Check all companies to delete exist and user has permission
    // Allow deletion if user is ADMIN/OWNER OR if they're the only member (they created it)
    const companiesToDelete = memberships.filter(
      (m) => {
        if (!deleteCompanyIds.includes(m.companyId)) return false;
        
        const roleUpper = m.role.toUpperCase();
        const hasAdminRole = roleUpper === "OWNER" || roleUpper === "ADMIN";
        // Check if user is the only active member (they created it)
        const isOnlyMember = m.company._count.memberships <= 1;
        const companyAge = Date.now() - new Date(m.company.createdAt).getTime();
        const isRecentCompany = companyAge < 7 * 24 * 60 * 60 * 1000; // Created within last 7 days
        
        return hasAdminRole || isOnlyMember || isRecentCompany;
      }
    );

    if (companiesToDelete.length !== deleteCompanyIds.length) {
      // Check which companies the user doesn't have permission for
      const requestedCompanyIds = new Set(deleteCompanyIds);
      const userCompanyIds = new Set(companiesToDelete.map(m => m.companyId));
      const missingCompanyIds = deleteCompanyIds.filter(id => !userCompanyIds.has(id));
      
      // Get details about why they can't delete these companies
      const missingMemberships = memberships.filter(m => missingCompanyIds.includes(m.companyId));
      const reasons = missingMemberships.map(m => {
        const roleUpper = m.role.toUpperCase();
        const hasAdminRole = roleUpper === "OWNER" || roleUpper === "ADMIN";
        const isOnlyMember = m.company._count.memberships <= 1;
        const companyAge = Date.now() - new Date(m.company.createdAt).getTime();
        const isRecentCompany = companyAge < 7 * 24 * 60 * 60 * 1000;
        
        return `Company ${m.companyId} (${m.company.name}): role=${m.role}, isOnlyMember=${isOnlyMember}, isRecent=${isRecentCompany}, hasAdminRole=${hasAdminRole}`;
      });
      
      logger.warn(`User ${user.id} attempted to delete companies without permission`, {
        userId: user.id,
        missingCompanyIds,
        reasons,
        allMemberships: memberships.map(m => ({ companyId: m.companyId, role: m.role, companyName: m.company.name })),
      }, "Companies");
      
      return NextResponse.json(
        { 
          error: `You don't have permission to delete some companies. Missing permission for company IDs: ${missingCompanyIds.join(', ')}. Details: ${reasons.join('; ')}`,
          missingCompanyIds,
          reasons,
        },
        { status: 403 }
      );
    }

    // Archive companies by deactivating all memberships
    const results = await prisma.$transaction(
      companiesToDelete.map((membership) =>
        prisma.membership.updateMany({
          where: { companyId: membership.companyId },
          data: { isActive: false },
        })
      )
    );

    // Clear cache
    await clearUserCache(user.id);

    logger.info(`User ${user.id} cleaned up ${companiesToDelete.length} duplicate companies`, {
      userId: user.id,
      keptCompanyId: keepCompanyId,
      deletedCompanyIds: deleteCompanyIds,
    }, "Companies");

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${companiesToDelete.length} duplicate company/companies`,
      archived: companiesToDelete.map((m) => ({
        companyId: m.companyId,
        companyName: m.company.name,
      })),
    });
  } catch (error) {
    logger.error("Error cleaning up duplicate companies", error, "Companies");
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: "Failed to cleanup duplicate companies",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

