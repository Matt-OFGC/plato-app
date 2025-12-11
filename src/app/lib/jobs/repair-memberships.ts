import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { generateDefaultCompanyName, generateCompanySlug } from '@/lib/company-defaults';
import { clearUserCache } from '@/lib/current';

interface RepairStats {
  usersChecked: number;
  orphanedUsersFixed: number;
  inactiveMembershipsActivated: number;
  errors: number;
  duration: number;
}

/**
 * Background job to proactively find and fix membership issues
 * Should be run daily/weekly via cron or scheduled task
 */
export async function repairMembershipsJob(): Promise<RepairStats> {
  const startTime = Date.now();
  const stats: RepairStats = {
    usersChecked: 0,
    orphanedUsersFixed: 0,
    inactiveMembershipsActivated: 0,
    errors: 0,
    duration: 0,
  };

  try {
    logger.info('Starting membership repair job', {}, 'RepairJob');

    // Find users with no memberships (orphaned)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        memberships: {
          none: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 100, // Process in batches
    });

    stats.usersChecked += orphanedUsers.length;

    // Fix orphaned users
    for (const user of orphanedUsers) {
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
              userId: user.id,
              companyId: company.id,
              role: 'OWNER',
              isActive: true,
            },
          });

          return { company, membership };
        });

        await clearUserCache(user.id);

        stats.orphanedUsersFixed++;
        logger.info(`Repaired orphaned user ${user.id}`, {
          userId: user.id,
          email: user.email,
          companyId: result.company.id,
        }, 'RepairJob');
      } catch (error) {
        stats.errors++;
        logger.error(`Failed to repair orphaned user ${user.id}`, error, 'RepairJob');
      }
    }

    // Find users with only inactive memberships
    const usersWithOnlyInactive = await prisma.user.findMany({
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
      select: {
        id: true,
        email: true,
        memberships: {
          where: { isActive: false },
          orderBy: { createdAt: 'asc' },
          take: 1, // Get the first (oldest) inactive membership
          select: {
            id: true,
            companyId: true,
          },
        },
      },
      take: 100, // Process in batches
    });

    stats.usersChecked += usersWithOnlyInactive.length;

    // Activate inactive memberships
    for (const user of usersWithOnlyInactive) {
      if (user.memberships.length === 0) continue;

      try {
        const membershipToActivate = user.memberships[0];
        await prisma.membership.update({
          where: { id: membershipToActivate.id },
          data: { isActive: true },
        });

        await clearUserCache(user.id);

        stats.inactiveMembershipsActivated++;
        logger.info(`Activated membership for user ${user.id}`, {
          userId: user.id,
          email: user.email,
          membershipId: membershipToActivate.id,
          companyId: membershipToActivate.companyId,
        }, 'RepairJob');
      } catch (error) {
        stats.errors++;
        logger.error(`Failed to activate membership for user ${user.id}`, error, 'RepairJob');
      }
    }

    stats.duration = Date.now() - startTime;

    logger.info('Membership repair job completed', stats, 'RepairJob');

    return stats;
  } catch (error) {
    stats.duration = Date.now() - startTime;
    stats.errors++;
    logger.error('Membership repair job failed', error, 'RepairJob');
    throw error;
  }
}

/**
 * API endpoint wrapper for manual execution
 */
export async function runRepairJobManually(): Promise<RepairStats> {
  return await repairMembershipsJob();
}
