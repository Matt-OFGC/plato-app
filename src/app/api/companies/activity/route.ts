import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Get company activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = parseInt(searchParams.get('companyId') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter'); // 'all', 'recipes', 'ingredients', 'team'

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const hasAccess = await hasCompanyAccess(session.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this company" },
        { status: 403 }
      );
    }

    // Build where clause based on filter
    let whereClause: any = { companyId };
    if (filter === 'recipes') {
      whereClause.entity = 'Recipe';
    } else if (filter === 'ingredients') {
      whereClause.entity = 'Ingredient';
    } else if (filter === 'team') {
      whereClause.entity = { in: ['Membership', 'TeamInvitation'] };
    }

    // Activity log might not exist, handle gracefully
    let activities: any[] = [];
    try {
      if (prisma.activityLog) {
        activities = await prisma.activityLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      }
    } catch {
      // Model doesn't exist, return empty array
    }

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      entity: activity.entity,
      entityId: activity.entityId,
      entityName: activity.entityName,
      user: activity.user,
      timestamp: activity.createdAt,
      details: activity.details,
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
      total: formattedActivities.length,
    });
  } catch (error) {
    logger.error("Error fetching company activity", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
