import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth-simple";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasCompanyAccess } from "@/lib/current";

/**
 * Get company usage statistics
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

    // Get usage stats
    const [
      recipesCreated,
      ingredientsCreated,
      recipesUpdated,
      ingredientsUpdated,
      teamActivity,
      peakUsageTimes,
    ] = await Promise.all([
      // Recipes created over time
      prisma.recipe.findMany({
        where: { companyId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Ingredients created over time
      prisma.ingredient.findMany({
        where: { companyId },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Recent recipe updates
      prisma.recipe.findMany({
        where: { companyId },
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      // Recent ingredient updates
      prisma.ingredient.findMany({
        where: { companyId },
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      // Team activity (might not exist)
      (async () => {
        try {
          if (prisma.activityLog) {
            return await prisma.activityLog.findMany({
              where: { companyId },
              select: { createdAt: true, userId: true },
              orderBy: { createdAt: 'desc' },
              take: 1000,
            });
          }
        } catch {
          // Model doesn't exist
        }
        return [];
      })(),
      // Peak usage (would need more detailed tracking)
      Promise.resolve([]),
    ]);

    // Calculate stats
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recipesLast30Days = recipesCreated.filter(r => r.createdAt >= last30Days).length;
    const recipesLast7Days = recipesCreated.filter(r => r.createdAt >= last7Days).length;
    const ingredientsLast30Days = ingredientsCreated.filter(i => i.createdAt >= last30Days).length;

    // Calculate most used features (simplified)
    const featureUsage = {
      recipes: recipesCreated.length,
      ingredients: ingredientsCreated.length,
      updates: recipesUpdated.length + ingredientsUpdated.length,
    };

    // Calculate active hours (simplified - would need better tracking)
    const activityByHour = teamActivity.reduce((acc, activity) => {
      const hour = new Date(activity.createdAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(activityByHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return NextResponse.json({
      success: true,
      stats: {
        totalRecipes: recipesCreated.length,
        totalIngredients: ingredientsCreated.length,
        recipesLast30Days,
        recipesLast7Days,
        ingredientsLast30Days,
        featureUsage,
        peakUsageHour: peakHour,
        totalActivity: teamActivity.length,
      },
    });
  } catch (error) {
    logger.error("Error fetching usage stats", error, "Companies");
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    );
  }
}
