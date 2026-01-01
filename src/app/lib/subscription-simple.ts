/**
 * Simplified subscription system - single source of truth
 * Free tier: 5 ingredients, 2 test recipes
 * Paid tier: Unlimited everything
 */

import { prisma } from "./prisma";
import { logger } from "./logger";

/**
 * Check if user has paid subscription
 */
export async function isPaid(userId: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!user) {
      return false;
    }

    const tierLower = user.subscriptionTier?.toLowerCase() || "";
    
    // Paid tier
    if (tierLower === "paid") {
      // Check if subscription is still active
      if (user.subscriptionEndsAt) {
        return new Date(user.subscriptionEndsAt) > new Date();
      }
      return user.subscriptionStatus === "active";
    }

    // Backward compatibility: old tiers are considered paid
    const oldPaidTiers = ["professional", "team", "business"]; // MVP: plato-bake removed
    if (oldPaidTiers.includes(tierLower)) {
      if (user.subscriptionEndsAt) {
        return new Date(user.subscriptionEndsAt) > new Date();
      }
      return user.subscriptionStatus === "active";
    }

    return false;
  } catch (error) {
    console.error("[isPaid] Error checking subscription:", error);
    // Fail closed - deny access on error
    return false;
  }
}

/**
 * Get ingredient limit for user
 */
export async function getIngredientLimit(userId: number): Promise<number> {
  const paid = await isPaid(userId);
  return paid ? Infinity : 5;
}

/**
 * Get recipe limit for user
 */
export async function getRecipeLimit(userId: number): Promise<number> {
  const paid = await isPaid(userId);
  return paid ? Infinity : 2; // Free tier: 2 test recipes
}
