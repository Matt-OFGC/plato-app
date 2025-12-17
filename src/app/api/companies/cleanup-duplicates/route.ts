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

    // Verify user owns all the companies they're trying to delete
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
            _count: {
              select: {
                recipes: true,
                ingredients: true,
                memberships: true,
              },
            },
          },
        },
      },
    });

    // Check all companies exist and user is OWNER
    const companiesToDelete = memberships.filter(
      (m) => deleteCompanyIds.includes(m.companyId) && m.role === "OWNER"
    );

    if (companiesToDelete.length !== deleteCompanyIds.length) {
      return NextResponse.json(
        { error: "You must be OWNER of all companies you're trying to delete" },
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
    return NextResponse.json(
      { error: "Failed to cleanup duplicate companies" },
      { status: 500 }
    );
  }
}

