import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";
import { calculateCompanyHealth } from "@/lib/company-health";

/**
 * Get company analytics and metrics
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

    // Get analytics data
    const [
      company,
      memberships,
      recipes,
      ingredients,
      recentActivity,
      healthMetrics,
    ] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
      prisma.membership.findMany({
        where: { companyId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.recipe.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.ingredient.findMany({
        where: { companyId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      // Activity log might not exist, handle gracefully
      (async () => {
        try {
          if (prisma.activityLog) {
            return await prisma.activityLog.findMany({
              where: { companyId },
              orderBy: { createdAt: 'desc' },
              take: 50,
              select: {
                action: true,
                entity: true,
                createdAt: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            });
          }
        } catch {
          // Model doesn't exist
        }
        return [];
      })(),
      calculateCompanyHealth(companyId),
    ]);

    // Calculate growth metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recipesLast30Days = recipes.filter(r => r.createdAt >= thirtyDaysAgo).length;
    const recipesLast7Days = recipes.filter(r => r.createdAt >= sevenDaysAgo).length;
    const ingredientsLast30Days = ingredients.filter(i => i.createdAt >= thirtyDaysAgo).length;

    // Calculate most active users
    const userActivity = recentActivity.reduce((acc, log) => {
      const userId = log.user?.email || 'unknown';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveUsers = Object.entries(userActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({ email, activityCount: count }));

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalRecipes: recipes.length,
          totalIngredients: ingredients.length,
          totalMembers: memberships.length,
          companyAgeDays: Math.floor(
            (now.getTime() - company!.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
        growth: {
          recipesLast30Days,
          recipesLast7Days,
          ingredientsLast30Days,
          recipesGrowthRate: recipes.length > 0
            ? ((recipesLast30Days / recipes.length) * 100).toFixed(1)
            : "0",
        },
        activity: {
          recentActions: recentActivity.length,
          mostActiveUsers,
          lastActivity: recentActivity[0]?.createdAt || null,
        },
        health: healthMetrics,
      },
    });
  } catch (error) {
    logger.error("Error fetching company analytics", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
