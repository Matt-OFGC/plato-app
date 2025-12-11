import { prisma } from "@/lib/prisma";

export interface CompanyHealthMetrics {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: {
    activeUsers: number;
    totalUsers: number;
    recipesCreated: number;
    ingredientsAdded: number;
    lastActivityDays: number | null;
    dataCompleteness: number; // 0-100
  };
  recommendations: string[];
}

/**
 * Calculate overall health score for a company
 */
export async function calculateCompanyHealth(
  companyId: number
): Promise<CompanyHealthMetrics> {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get company data
    const [company, memberships, recipes, ingredients, recentActivity] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          name: true,
          businessType: true,
          country: true,
          createdAt: true,
        },
      }),
      prisma.membership.findMany({
        where: { companyId, isActive: true },
        include: {
          user: {
            select: {
              lastLoginAt: true,
            },
          },
        },
      }),
      prisma.recipe.count({
        where: { companyId },
      }),
      prisma.ingredient.count({
        where: { companyId },
      }),
      // Activity log might not exist, handle gracefully
      (async () => {
        try {
          if (prisma.activityLog) {
            return await prisma.activityLog.findFirst({
              where: { companyId },
              orderBy: { createdAt: 'desc' },
              select: { createdAt: true },
            });
          }
        } catch {
          // Model doesn't exist
        }
        return null;
      })(),
    ]);

    if (!company) {
      throw new Error('Company not found');
    }

    // Calculate metrics
    const totalUsers = memberships.length;
    const activeUsers = memberships.filter(
      m => m.user.lastLoginAt && m.user.lastLoginAt >= thirtyDaysAgo
    ).length;

    const lastActivityDays = recentActivity?.createdAt
      ? Math.floor((now.getTime() - recentActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate data completeness (0-100)
    let completenessScore = 0;
    if (company.name) completenessScore += 20;
    if (company.businessType) completenessScore += 20;
    if (company.country) completenessScore += 20;
    if (recipes > 0) completenessScore += 20;
    if (ingredients > 0) completenessScore += 20;

    // Calculate overall health score
    let healthScore = 0;

    // Active users (30 points max)
    if (totalUsers > 0) {
      healthScore += Math.min(30, (activeUsers / totalUsers) * 30);
    }

    // Content creation (40 points max)
    healthScore += Math.min(20, recipes * 2); // Up to 10 recipes
    healthScore += Math.min(20, ingredients); // Up to 20 ingredients

    // Recent activity (30 points max)
    if (lastActivityDays !== null) {
      if (lastActivityDays <= 1) healthScore += 30;
      else if (lastActivityDays <= 7) healthScore += 20;
      else if (lastActivityDays <= 30) healthScore += 10;
    }

    // Determine status
    let status: CompanyHealthMetrics['status'];
    if (healthScore >= 80) status = 'excellent';
    else if (healthScore >= 60) status = 'good';
    else if (healthScore >= 40) status = 'fair';
    else status = 'poor';

    // Generate recommendations
    const recommendations: string[] = [];
    if (activeUsers < totalUsers * 0.5) {
      recommendations.push('Encourage more team members to log in regularly');
    }
    if (recipes < 5) {
      recommendations.push('Create more recipes to maximize the value of the platform');
    }
    if (ingredients < 10) {
      recommendations.push('Add more ingredients to your inventory');
    }
    if (lastActivityDays && lastActivityDays > 7) {
      recommendations.push('Increase team activity - no recent actions detected');
    }
    if (completenessScore < 80) {
      recommendations.push('Complete your company profile for better insights');
    }

    return {
      score: Math.round(healthScore),
      status,
      metrics: {
        activeUsers,
        totalUsers,
        recipesCreated: recipes,
        ingredientsAdded: ingredients,
        lastActivityDays,
        dataCompleteness: completenessScore,
      },
      recommendations,
    };
  } catch (error) {
    // Return default/safe values on error
    return {
      score: 0,
      status: 'poor',
      metrics: {
        activeUsers: 0,
        totalUsers: 0,
        recipesCreated: 0,
        ingredientsAdded: 0,
        lastActivityDays: null,
        dataCompleteness: 0,
      },
      recommendations: ['Unable to calculate health metrics'],
    };
  }
}
