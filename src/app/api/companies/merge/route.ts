import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { clearUserCache } from "@/lib/current";
import { auditLog } from "@/lib/audit-log";

/**
 * Merge two companies into one
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
    const { sourceCompanyId, targetCompanyId, mergeStrategy } = body;

    if (!sourceCompanyId || !targetCompanyId) {
      return NextResponse.json(
        { error: "Source and target company IDs are required" },
        { status: 400 }
      );
    }

    if (sourceCompanyId === targetCompanyId) {
      return NextResponse.json(
        { error: "Cannot merge a company with itself" },
        { status: 400 }
      );
    }

    // Verify user is owner of both companies
    const [sourceMembership, targetMembership] = await Promise.all([
      prisma.membership.findUnique({
        where: {
          userId_companyId: {
            userId: session.id,
            companyId: sourceCompanyId,
          },
        },
        include: { company: true },
      }),
      prisma.membership.findUnique({
        where: {
          userId_companyId: {
            userId: session.id,
            companyId: targetCompanyId,
          },
        },
        include: { company: true },
      }),
    ]);

    if (!sourceMembership || sourceMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "You must be the owner of the source company" },
        { status: 403 }
      );
    }

    if (!targetMembership || targetMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "You must be the owner of the target company" },
        { status: 403 }
      );
    }

    const sourceCompany = sourceMembership.company;
    const targetCompany = targetMembership.company;

    // Merge companies in transaction
    const mergeResult = await prisma.$transaction(async (tx) => {
      // Strategy: "keep_target" (default) - keep target company, move data from source
      // Strategy: "keep_source" - keep source company, move data from target
      const keepCompanyId = mergeStrategy === "keep_source" ? sourceCompanyId : targetCompanyId;
      const mergeFromCompanyId = mergeStrategy === "keep_source" ? targetCompanyId : sourceCompanyId;
      const keepCompany = mergeStrategy === "keep_source" ? sourceCompany : targetCompany;
      const mergeFromCompany = mergeStrategy === "keep_source" ? targetCompany : sourceCompany;

      // Move all memberships from source to target (except duplicates)
      const sourceMemberships = await tx.membership.findMany({
        where: { companyId: mergeFromCompanyId, isActive: true },
      });

      for (const membership of sourceMemberships) {
        // Check if user already has membership in target company
        const existing = await tx.membership.findUnique({
          where: {
            userId_companyId: {
              userId: membership.userId,
              companyId: keepCompanyId,
            },
          },
        });

        if (!existing) {
          // Move membership to target company
          await tx.membership.update({
            where: { id: membership.id },
            data: { companyId: keepCompanyId },
          });
        } else {
          // User already in target company - deactivate source membership
          await tx.membership.update({
            where: { id: membership.id },
            data: { isActive: false },
          });
        }
      }

      // Move recipes (handle name conflicts)
      const sourceRecipes = await tx.recipe.findMany({
        where: { companyId: mergeFromCompanyId },
      });

      for (const recipe of sourceRecipes) {
        // Check for name conflict
        const existing = await tx.recipe.findUnique({
          where: {
            name_companyId: {
              name: recipe.name,
              companyId: keepCompanyId,
            },
          },
        });

        if (existing) {
          // Rename with suffix
          await tx.recipe.update({
            where: { id: recipe.id },
            data: {
              companyId: keepCompanyId,
              name: `${recipe.name} (from ${mergeFromCompany.name})`,
            },
          });
        } else {
          await tx.recipe.update({
            where: { id: recipe.id },
            data: { companyId: keepCompanyId },
          });
        }
      }

      // Move ingredients (handle name conflicts)
      const sourceIngredients = await tx.ingredient.findMany({
        where: { companyId: mergeFromCompanyId },
      });

      for (const ingredient of sourceIngredients) {
        const existing = await tx.ingredient.findUnique({
          where: {
            name_companyId: {
              name: ingredient.name,
              companyId: keepCompanyId,
            },
          },
        });

        if (existing) {
          await tx.ingredient.update({
            where: { id: ingredient.id },
            data: {
              companyId: keepCompanyId,
              name: `${ingredient.name} (from ${mergeFromCompany.name})`,
            },
          });
        } else {
          await tx.ingredient.update({
            where: { id: ingredient.id },
            data: { companyId: keepCompanyId },
          });
        }
      }

      // Deactivate source company memberships (soft delete)
      await tx.membership.updateMany({
        where: { companyId: mergeFromCompanyId },
        data: { isActive: false },
      });

      return {
        keptCompany: keepCompany,
        mergedFromCompany: mergeFromCompany,
        keptCompanyId: keepCompanyId,
      };
    });

    // Clear caches for all affected users
    const affectedUsers = await prisma.membership.findMany({
      where: {
        companyId: mergeResult.keptCompanyId,
        isActive: true,
      },
      select: { userId: true },
    });

    for (const membership of affectedUsers) {
      await clearUserCache(membership.userId);
    }

    // Audit
    await auditLog.companyUpdated(
      session.id,
      mergeResult.keptCompanyId,
      {
        action: "merge_company",
        mergedFromCompanyId: mergeResult.mergedFromCompany.id,
        mergedFromCompanyName: mergeResult.mergedFromCompany.name,
        strategy: mergeStrategy || "keep_target",
      }
    );

    logger.info(`Companies merged`, {
      sourceCompanyId,
      targetCompanyId,
      keptCompanyId: mergeResult.keptCompanyId,
      userId: session.id,
    }, "Companies");

    return NextResponse.json({
      success: true,
      company: mergeResult.keptCompany,
      message: `Companies merged into "${mergeResult.keptCompany.name}"`,
    });
  } catch (error) {
    logger.error("Error merging companies", error, "Companies");
    return NextResponse.json(
      { error: "Failed to merge companies" },
      { status: 500 }
    );
  }
}
