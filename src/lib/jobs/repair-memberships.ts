import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Repair memberships job - ensures all users have proper company memberships
 */
export async function runRepairJobManually(): Promise<{
  success: boolean;
  usersChecked: number;
  usersFixed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let usersChecked = 0;
  let usersFixed = 0;

  try {
    logger.info("Starting membership repair job", {}, "RepairJob");

    // Find all users
    const users = await prisma.user.findMany({
      include: {
        memberships: {
          where: { isActive: true },
        },
      },
    });

    usersChecked = users.length;

    for (const user of users) {
      try {
        // Check if user has at least one active membership
        if (user.memberships.length === 0) {
          logger.warn(`User ${user.id} (${user.email}) has no active memberships`, {}, "RepairJob");

          // Check if user has any companies at all
          const allMemberships = await prisma.membership.findMany({
            where: { userId: user.id },
            include: { company: true },
          });

          if (allMemberships.length > 0) {
            // Reactivate the most recent membership
            const mostRecent = allMemberships.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )[0];

            await prisma.membership.update({
              where: { id: mostRecent.id },
              data: { isActive: true },
            });

            logger.info(
              `Reactivated membership for user ${user.id} to company ${mostRecent.company.name}`,
              {},
              "RepairJob"
            );
            usersFixed++;
          } else {
            // User has no company at all - this shouldn't happen in normal operation
            errors.push(`User ${user.email} has no company memberships at all`);
            logger.error(
              `User ${user.id} (${user.email}) has no company memberships at all`,
              {},
              "RepairJob"
            );
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to repair user ${user.email}: ${errorMessage}`);
        logger.error(
          `Failed to repair memberships for user ${user.id}`,
          error,
          "RepairJob"
        );
      }
    }

    logger.info(
      `Membership repair job completed: ${usersChecked} users checked, ${usersFixed} users fixed`,
      {},
      "RepairJob"
    );

    return {
      success: true,
      usersChecked,
      usersFixed,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Membership repair job failed", error, "RepairJob");

    return {
      success: false,
      usersChecked,
      usersFixed,
      errors: [errorMessage, ...errors],
    };
  }
}
