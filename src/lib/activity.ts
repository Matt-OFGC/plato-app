import { prisma } from "@/lib/prisma";

interface LogActivityParams {
  userId: number;
  companyId: number;
  action: "created" | "updated" | "deleted" | "viewed";
  entity: string;
  entityId?: number;
  entityName?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityName: params.entityName,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging should never break the app
  }
}

export async function getRecentActivity(companyId: number, limit = 50) {
  return await prisma.activityLog.findMany({
    where: { companyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

