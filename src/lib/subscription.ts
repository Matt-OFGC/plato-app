/**
 * Legacy subscription utilities for backwards compatibility
 * These functions check tier-based access but will be deprecated
 * New code should use lib/features.ts instead
 */

import { prisma } from "@/lib/prisma";
import { checkSectionAccess, checkRecipesLimits, isRecipesTrial } from "./features";

/**
 * Legacy: Check if user can access production features (via tier)
 * NEW: Checks if user has Production module unlocked
 */
export async function canAccessProduction(userId: number): Promise<boolean> {
  // Use new feature module system
  return checkSectionAccess(userId, "production");
}

/**
 * Legacy: Check if user can access wholesale features (via tier)
 * NEW: Checks if user has Wholesale features (part of Business tier, but we'll check Production/Business for now)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  // For now, wholesale is part of Production module
  // In future, might be separate module
  return checkSectionAccess(userId, "production");
}

/**
 * Check if user can add more ingredients (Recipes trial limits)
 */
export async function canAddIngredient(userId: number): Promise<boolean> {
  const limits = await checkRecipesLimits(userId);
  return limits.withinIngredientsLimit;
}

/**
 * Check if user can add more recipes (Recipes trial limits)
 */
export async function canAddRecipe(userId: number): Promise<boolean> {
  const limits = await checkRecipesLimits(userId);
  return limits.withinRecipesLimit;
}

/**
 * Update ingredient count after creation
 */
export async function updateIngredientCount(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ingredientCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Update recipe count after creation
 */
export async function updateRecipeCount(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      recipeCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Legacy: Create feature gate error response
 */
export function createFeatureGateError(
  requiredTier: string,
  currentTier: string,
  featureName: string
) {
  return {
    error: "Feature not available",
    code: "FEATURE_GATED",
    requiredTier,
    currentTier,
    featureName,
    message: `${featureName} requires ${requiredTier} tier. You currently have ${currentTier} tier.`,
  };
}

/**
 * Check if user can invite team members
 * Teams feature requires Teams module or higher tier
 */
export async function canInviteTeamMembers(userId: number): Promise<boolean> {
  return checkSectionAccess(userId, "teams");
}

/**
 * Get user subscription information
 */
export async function getUserSubscription(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeCustomerId: true,
      subscriptionTier: true,
    },
  });

  if (!user?.stripeCustomerId) {
    return null;
  }

  // Return subscription info
  return {
    tier: user.subscriptionTier || 'free',
    customerId: user.stripeCustomerId,
  };
}

