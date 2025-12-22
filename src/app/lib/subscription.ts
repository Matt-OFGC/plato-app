/**
 * Subscription utilities - simplified system
 * Free tier: 5 ingredients, 5 recipes
 * Paid tier: Unlimited everything
 */

import { isPaid, getIngredientLimit, getRecipeLimit } from "./subscription-simple";
import { prisma } from "./prisma";

/**
 * Create feature gate error (deprecated - all features are MVP now)
 * Kept for backwards compatibility
 */
export function createFeatureGateError(module: string, featureName: string) {
  return {
    error: `${featureName} is not available on your current plan. Please upgrade to access this feature.`,
    code: "FEATURE_GATED",
    module,
  };
}

/**
 * Check if user can access production features
 * All users can access production (it's part of MVP)
 */
export async function canAccessProduction(userId: number): Promise<boolean> {
  return true; // Production is part of MVP
}

/**
 * Check if user can access wholesale features
 * All users can access wholesale (it's part of MVP)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  return true; // Wholesale is part of MVP
}

/**
 * Check if user can invite team members
 * All users can invite team members (it's part of MVP)
 */
export async function canInviteTeamMembers(userId: number): Promise<boolean> {
  return true; // Team management is part of MVP
}

/**
 * Check if user can add more ingredients
 * Free tier: Limited to 5
 * Paid tier: Unlimited
 */
export async function canAddIngredient(userId: number): Promise<boolean> {
  const limit = await getIngredientLimit(userId);
  if (limit === Infinity) {
    return true;
  }
  
  // Count current ingredients
  const count = await prisma.ingredient.count({
    where: {
      companyId: {
        in: await prisma.membership.findMany({
          where: { userId, isActive: true },
          select: { companyId: true },
        }).then(memberships => memberships.map(m => m.companyId)),
      },
    },
  });
  
  return count < limit;
}

/**
 * Check if user can add more recipes
 * Free tier: Limited to 5
 * Paid tier: Unlimited
 */
export async function canAddRecipe(userId: number): Promise<boolean> {
  const limit = await getRecipeLimit(userId);
  if (limit === Infinity) {
    return true;
  }
  
  // Count current recipes
  const count = await prisma.recipe.count({
    where: {
      companyId: {
        in: await prisma.membership.findMany({
          where: { userId, isActive: true },
          select: { companyId: true },
        }).then(memberships => memberships.map(m => m.companyId)),
      },
    },
  });
  
  return count < limit;
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
