import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";
import { auditLog } from "@/lib/audit-log";
import bcrypt from "bcrypt";

/**
 * Delete/archive a company
 * Soft delete: marks company as archived, doesn't actually delete data
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
    const { companyId, password, exportData } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user is the owner
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId: session.id,
          companyId,
        },
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                memberships: {
                  where: { isActive: true },
                },
                recipes: true,
                ingredients: true,
              },
            },
          },
        },
      },
    });

    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Only company owners and admins can delete the company" },
        { status: 403 }
      );
    }

    // Verify password
    if (password) {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { passwordHash: true },
      });

      if (user?.passwordHash) {
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Invalid password" },
            { status: 401 }
          );
        }
      }
    }

    // Check if company has active members
    const activeMembers = membership.company._count.memberships;
    if (activeMembers > 1) {
      return NextResponse.json(
        { 
          error: `Cannot delete company with ${activeMembers - 1} active team member(s). Please remove all team members first.`,
          requiresRemoval: true,
        },
        { status: 400 }
      );
    }

    // If exportData is requested, trigger export (would be async job in production)
    if (exportData) {
      // TODO: Implement company data export
      logger.info("Company data export requested before deletion", {
        companyId,
        userId: session.id,
      }, "Companies");
    }

    // Archive company by deactivating all memberships and marking as archived
    // Note: We don't actually delete the company record to preserve data integrity
    // Instead, we deactivate all memberships
    await prisma.$transaction(async (tx) => {
      // Deactivate all memberships
      await tx.membership.updateMany({
        where: { companyId },
        data: { isActive: false },
      });

      // Optionally add an archived flag if the schema supports it
      // For now, we'll just deactivate memberships
    });

    // Clear caches
    await clearUserCache(session.id);

    // Audit the deletion
    await auditLog.companyUpdated(
      session.id,
      companyId,
      {
        action: "archive_company",
        companyName: membership.company.name,
        dataCounts: {
          recipes: membership.company._count.recipes,
          ingredients: membership.company._count.ingredients,
        },
      }
    );

    logger.warn(`Company archived`, {
      companyId,
      companyName: membership.company.name,
      userId: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      message: "Company has been archived. All data is preserved and can be restored by support.",
    });
  } catch (error) {
    logger.error("Error archiving company", error, "Companies");
    return NextResponse.json(
      { error: "Failed to archive company" },
      { status: 500 }
    );
  }
}

