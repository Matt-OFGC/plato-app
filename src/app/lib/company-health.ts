import { prisma } from './prisma';

export interface CompanyHealthMetrics {
  score: number;
  completeness: number;
  activity: number;
  teamEngagement: number;
  dataQuality: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Calculate company health score
 */
export async function calculateCompanyHealth(companyId: number): Promise<CompanyHealthMetrics> {
  const [
    company,
    memberships,
    recipes,
    ingredients,
    recentActivity,
  ] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        businessType: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        address: true,
        logoUrl: true,
        profileBio: true,
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
    prisma.recipe.findMany({
      where: { companyId },
      select: { id: true, updatedAt: true },
    }),
    prisma.ingredient.findMany({
      where: { companyId },
      select: { id: true, updatedAt: true },
    }),
    // Activity log might not exist, handle gracefully
    (async () => {
      try {
        if (prisma.activityLog) {
          return await prisma.activityLog.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: { createdAt: true },
          });
        }
      } catch {
        // Model doesn't exist or error
      }
      return [];
    })(),
  ]);

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Calculate completeness (0-100)
  let completenessScore = 0;
  const completenessFactors = {
    name: company?.name ? 10 : 0,
    businessType: company?.businessType ? 10 : 0,
    country: company?.country ? 10 : 0,
    phone: company?.phone ? 10 : 0,
    email: company?.email ? 10 : 0,
    website: company?.website ? 5 : 0,
    address: company?.address ? 10 : 0,
    logoUrl: company?.logoUrl ? 10 : 0,
    profileBio: company?.profileBio ? 5 : 0,
    hasRecipes: recipes.length > 0 ? 10 : 0,
    hasIngredients: ingredients.length > 0 ? 10 : 0,
  };
  completenessScore = Object.values(completenessFactors).reduce((sum, val) => sum + val, 0);

  if (completenessScore < 50) {
    issues.push("Company profile is incomplete");
    recommendations.push("Complete your company profile in Business Settings");
  }

  // Calculate activity (0-100)
  const daysSinceLastActivity = recentActivity.length > 0
    ? Math.floor((Date.now() - recentActivity[0].createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  let activityScore = 100;
  if (daysSinceLastActivity > 30) {
    activityScore = 30;
    issues.push("No recent activity");
    recommendations.push("Start using the platform to track your recipes and ingredients");
  } else if (daysSinceLastActivity > 7) {
    activityScore = 60;
  }

  // Calculate team engagement (0-100)
  const activeMembers = memberships.length;
  const membersWithRecentLogin = memberships.filter(
    m => m.user.lastLoginAt && 
    (Date.now() - m.user.lastLoginAt.getTime()) < 30 * 24 * 60 * 60 * 1000
  ).length;

  let teamEngagementScore = activeMembers > 0
    ? (membersWithRecentLogin / activeMembers) * 100
    : 50;

  if (activeMembers === 1) {
    teamEngagementScore = 70; // Single member is OK
  } else if (teamEngagementScore < 50) {
    issues.push("Low team engagement");
    recommendations.push("Invite team members and encourage them to use the platform");
  }

  // Calculate data quality (0-100)
  const recipesWithIngredients = recipes.filter(r => {
    // Would need to check if recipe has items
    return true; // Simplified
  }).length;

  let dataQualityScore = 100;
  if (recipes.length > 0 && ingredients.length === 0) {
    dataQualityScore = 40;
    issues.push("Recipes missing ingredient data");
    recommendations.push("Add ingredients to enable cost calculations");
  } else if (recipes.length === 0 && ingredients.length > 0) {
    dataQualityScore = 60;
    issues.push("No recipes created yet");
    recommendations.push("Create your first recipe to get started");
  }

  // Overall health score (weighted average)
  const healthScore = Math.round(
    completenessScore * 0.3 +
    activityScore * 0.3 +
    teamEngagementScore * 0.2 +
    dataQualityScore * 0.2
  );

  return {
    score: healthScore,
    completeness: completenessScore,
    activity: activityScore,
    teamEngagement: teamEngagementScore,
    dataQuality: dataQualityScore,
    issues,
    recommendations,
  };
}
