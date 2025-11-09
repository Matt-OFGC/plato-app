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
 * NEW: Checks if user has Wholesale features (part of Production module)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  // Wholesale is part of Production module
  return checkSectionAccess(userId, "production");
}

/**
 * Check if user can invite team members
 * NEW: Checks if user has Teams module unlocked
 */
export async function canInviteTeamMembers(userId: number): Promise<boolean> {
  return checkSectionAccess(userId, "teams");
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
 * Create feature gate error response
 * Note: This now references feature modules, not subscription tiers
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
    message: `${featureName} requires the ${requiredModule} module to be unlocked. Please subscribe to unlock this feature.`,
  };
}

