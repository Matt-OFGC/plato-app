/**
 * Subscription utilities - tier-based system
 * Free tier: 10 ingredients, 2 recipes, only recipes section
 * Paid tier: Unlimited everything, all sections unlocked
 */

import { checkSectionAccess, checkRecipesLimits, isRecipesTrial } from "./features";
import { prisma } from "./prisma";

/**
 * Check if user can access production features
 */
export async function canAccessProduction(userId: number): Promise<boolean> {
  return checkSectionAccess(userId, "production");
}

/**
 * Check if user can access wholesale features (part of Production)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  return checkSectionAccess(userId, "production");
}

/**
 * Check if user can invite team members
 */
export async function canInviteTeamMembers(userId: number): Promise<boolean> {
  return checkSectionAccess(userId, "teams");
}

/**
 * Check if user can add more ingredients
 * Free tier: Limited to 10
 * Paid tier: Unlimited
 */
export async function canAddIngredient(userId: number): Promise<boolean> {
  const limits = await checkRecipesLimits(userId);
  return limits.withinIngredientsLimit;
}

/**
 * Check if user can add more recipes
 * Free tier: Limited to 2
 * Paid tier: Unlimited
 */
export async function canAddRecipe(userId: number): Promise<boolean> {
  const limits = await checkRecipesLimits(userId);
  return limits.withinRecipesLimit;
}

/**
 * Update ingredient count after creation
 * NOTE: This is now a no-op since we count directly from the database
 * Keeping for backwards compatibility
 */
export async function updateIngredientCount(userId: number): Promise<void> {
  // No-op: We count ingredients directly from the database now
}

/**
 * Update recipe count after creation
 * NOTE: This is now a no-op since we count directly from the database
 * Keeping for backwards compatibility
 */
export async function updateRecipeCount(userId: number): Promise<void> {
  // No-op: We count recipes directly from the database now
}

/**
 * Get user subscription information
 */
export async function getUserSubscription(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      subscriptionInterval: true,
    },
  });

  if (!user) {
    return null;
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  return {
    tier: user.subscriptionTier || "free",
    status: user.subscriptionStatus || "free",
    endsAt: user.subscriptionEndsAt,
    interval: user.subscriptionInterval,
    subscription,
  };
}

/**
 * Create feature gate error response
 */
export function createFeatureGateError(
  requiredModule: string,
  featureName: string
) {
  return {
    error: "Feature not available",
    code: "FEATURE_GATED",
    requiredModule,
    featureName,
    message: `${featureName} requires a paid subscription. Please upgrade to unlock this feature.`,
  };
}
