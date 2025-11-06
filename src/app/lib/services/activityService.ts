import { prisma } from "@/lib/prisma";

export interface ActivityItem {
  id: number;
  type: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  description: string;
  createdAt: Date;
  userId: number;
  userName: string | null;
}

/**
 * Get unified activity feed for a company
 */
export async function getCompanyActivity(
  companyId: number,
  limit: number = 50
): Promise<ActivityItem[]> {
  const activities = await prisma.activityLog.findMany({
    where: { companyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    action: activity.action,
    entityType: activity.relatedEntityType,
    entityId: activity.relatedEntityId,
    relatedEntityType: activity.relatedEntityType,
    relatedEntityId: activity.relatedEntityId,
    description: activity.description,
    createdAt: activity.createdAt,
    userId: activity.userId,
    userName: activity.user.name,
  }));
}

/**
 * Get activity for a specific staff member
 */
export async function getStaffActivity(
  membershipId: number,
  limit: number = 50
): Promise<ActivityItem[]> {
  // Get membership to find userId
  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { userId: true, companyId: true },
  });

  if (!membership) {
    return [];
  }

  // Get activities where user is involved or entity is related to this staff member
  const activities = await prisma.activityLog.findMany({
    where: {
      companyId: membership.companyId,
      OR: [
        { userId: membership.userId },
        {
          relatedEntityType: "staff",
          relatedEntityId: membershipId,
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    action: activity.action,
    entityType: activity.relatedEntityType,
    entityId: activity.relatedEntityId,
    relatedEntityType: activity.relatedEntityType,
    relatedEntityId: activity.relatedEntityId,
    description: activity.description,
    createdAt: activity.createdAt,
    userId: activity.userId,
    userName: activity.user.name,
  }));
}

/**
 * Log activity with related entity tracking
 */
export async function logActivity(
  userId: number,
  companyId: number,
  type: string,
  action: string,
  description: string,
  entityType?: string,
  entityId?: number,
  relatedEntityType?: string,
  relatedEntityId?: number
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId,
      companyId,
      type,
      action,
      description,
      relatedEntityType: entityType || null,
      relatedEntityId: entityId || null,
    },
  });
}

