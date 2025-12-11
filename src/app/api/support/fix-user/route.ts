import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateDefaultCompanyName, generateCompanySlug } from "@/lib/company-defaults";
import { clearUserCache } from "@/lib/current";
import { auditLog } from "@/lib/audit-log";

/**
 * Support team endpoint to fix specific user issues
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
    const { userId, action, companyId, membershipId } = body;

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

    const repairs: string[] = [];
    const errors: string[] = [];

    // Action: create_company
    if (action === "create_company") {
      try {
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

        await clearUserCache(userId);
        await auditLog.companyCreated(session.id, result.company.id, result.company.name);
        await auditLog.membershipCreated(
          session.id,
          result.company.id,
          result.membership.id,
          result.membership.role,
          'admin_fix'
        );

        repairs.push(`Created company "${result.company.name}" (ID: ${result.company.id}) and membership`);
      } catch (error) {
        errors.push(`Failed to create company: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Action: activate_membership
    if (action === "activate_membership" && membershipId) {
      try {
        const membership = await prisma.membership.findUnique({
          where: { id: membershipId },
          include: { company: true },
        });

        if (!membership) {
          errors.push(`Membership ${membershipId} not found`);
        } else {
          await prisma.membership.update({
            where: { id: membershipId },
            data: { isActive: true },
          });

          await clearUserCache(userId);
          await auditLog.membershipStatusChanged(
            session.id,
            membership.companyId,
            membershipId,
            false,
            true,
            'admin_fix'
          );

          repairs.push(`Activated membership ${membershipId} for company "${membership.company.name}"`);
        }
      } catch (error) {
        errors.push(`Failed to activate membership: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Action: create_membership
    if (action === "create_membership" && companyId) {
      try {
        const company = await prisma.company.findUnique({
          where: { id: companyId },
        });

        if (!company) {
          errors.push(`Company ${companyId} not found`);
        } else {
          // Check if membership already exists
          const existing = await prisma.membership.findUnique({
            where: {
              userId_companyId: {
                userId,
                companyId,
              },
            },
          });

          if (existing) {
            errors.push(`Membership already exists for user ${userId} and company ${companyId}`);
          } else {
            const membership = await prisma.membership.create({
              data: {
                userId,
                companyId,
                role: 'ADMIN',
                isActive: true,
              },
            });

            await clearUserCache(userId);
            await auditLog.membershipCreated(
              session.id,
              companyId,
              membership.id,
              membership.role,
              'admin_fix'
            );

            repairs.push(`Created membership for company "${company.name}"`);
          }
        }
      } catch (error) {
        errors.push(`Failed to create membership: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.info(`Admin user fix performed`, {
      performedBy: session.id,
      targetUserId: userId,
      action,
      repairs,
      errors,
    }, 'Admin');

    return NextResponse.json({
      success: true,
      repairs,
      errors: errors.length > 0 ? errors : undefined,
      message: repairs.length > 0
        ? `Completed ${repairs.length} repair(s)`
        : errors.length > 0
        ? "No repairs performed. See errors."
        : "No action taken",
    });
  } catch (error) {
    logger.error('Error in fix-user endpoint', error, 'Admin');
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
