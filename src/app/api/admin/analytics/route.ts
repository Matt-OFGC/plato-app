import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get overall stats
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      activeCompanies,
      totalRecipes,
      totalIngredients,
      subscriptions,
      memberships,
      activityLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.company.count(),
      prisma.company.count({ where: { memberships: { some: { isActive: true } } } }),
      prisma.recipe.count(),
      prisma.ingredient.count(),
      prisma.subscription.count(),
      prisma.membership.count({ where: { isActive: true } }),
      prisma.activityLog.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Get users by tier
    const usersByTier = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });

    // Get new signups over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const signups = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group signups by day
    const signupsByDay = signups.reduce((acc, user) => {
      const day = user.createdAt.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get login activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = await prisma.user.findMany({
      where: {
        lastLoginAt: { gte: sevenDaysAgo },
      },
      select: {
        lastLoginAt: true,
      },
    });

    const loginsByDay = recentLogins.reduce((acc, user) => {
      if (user.lastLoginAt) {
        const day = user.lastLoginAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get most active companies (by member count)
    const topCompanies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            recipes: true,
            ingredients: true,
          },
        },
      },
      orderBy: {
        memberships: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get feature usage by action type
    const featureUsage = await prisma.activityLog.groupBy({
      by: ['action'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    // Get business types distribution
    const businessTypes = await prisma.company.groupBy({
      by: ['businessType'],
      _count: { id: true },
      where: {
        businessType: { not: null },
      },
    });

    // Get countries distribution
    const countries = await prisma.company.groupBy({
      by: ['country'],
      _count: { id: true },
    });

    // Calculate engagement score (combines several metrics)
    const averageRecipesPerCompany = totalRecipes / totalCompanies || 0;
    const averageIngredientsPerCompany = totalIngredients / totalCompanies || 0;
    const engagementScore = Math.min(100, ((averageRecipesPerCompany / 10) + (averageIngredientsPerCompany / 20)) * 10);

    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalCompanies,
        activeCompanies,
        totalRecipes,
        totalIngredients,
        subscriptions,
        activeMemberships: memberships,
        recentLogins: recentLogins.length,
        monthlyActivity: activityLogs,
        engagementScore: Math.round(engagementScore),
      },
      usersByTier: usersByTier.map(t => ({
        tier: t.subscriptionTier,
        count: t._count.id,
      })),
      signupsByDay: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      loginsByDay: Object.entries(loginsByDay).map(([date, count]) => ({ date, count })),
      topCompanies: topCompanies.map(c => ({
        name: c.name,
        members: c._count.memberships,
        recipes: c._count.recipes,
        ingredients: c._count.ingredients,
      })),
      featureUsage: featureUsage.map(f => ({
        action: f.action,
        count: f._count.id,
      })),
      businessTypes: businessTypes.map(b => ({
        type: b.businessType,
        count: b._count.id,
      })),
      countries: countries.map(c => ({
        country: c.country,
        count: c._count.id,
      })),
      recentActivity: recentActivity.map(a => ({
        action: a.action,
        entity: a.entity,
        user: a.user.email,
        timestamp: a.createdAt,
      })),
    });
  } catch (error) {
    logger.error("Analytics error", error, "Admin/Analytics");
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
