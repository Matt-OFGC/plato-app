/**
 * Simplified subscription system - single source of truth
 * Free tier: 5 ingredients, 5 recipes
 * Paid tier: Unlimited everything
 * AI add-on: Company-level subscription (unlimited or capped)
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Check if user has paid subscription
 * Backward compatible: recognizes old tiers (professional, team, business, plato-bake) as paid
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
    
    // New simplified tiers
    if (tierLower === "paid") {
      // Check if subscription is still active
      if (user.subscriptionEndsAt) {
        return new Date(user.subscriptionEndsAt) > new Date();
      }
      return user.subscriptionStatus === "active";
    }

    // Backward compatibility: old tiers are considered paid
    const oldPaidTiers = ["professional", "team", "business", "plato-bake"];
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
 * Check if company has AI subscription
 */
export async function hasAIAccess(companyId: number): Promise<boolean> {
  try {
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        companyId,
        status: "active",
      },
    });

    if (!subscription) {
      return false;
    }

    // Check if subscription is still active
    if (subscription.currentPeriodEnd) {
      return new Date(subscription.currentPeriodEnd) > new Date();
    }

    return subscription.status === "active";
  } catch (error) {
    console.error("[hasAIAccess] Error checking AI subscription:", error);
    return false;
  }
}

/**
 * Get AI subscription type for a company
 */
export async function getAISubscriptionType(companyId: number): Promise<"unlimited" | "capped" | null> {
  try {
    const subscription = await prisma.mentorSubscription.findFirst({
      where: {
        companyId,
        status: "active",
      },
    });

    if (!subscription) {
      return null;
    }

    // Check if subscription is still active
    if (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) <= new Date()) {
      return null;
    }

    return subscription.subscriptionType as "unlimited" | "capped" | null;
  } catch (error) {
    console.error("[getAISubscriptionType] Error getting AI subscription type:", error);
    return null;
  }
}

/**
 * Check if user can use AI (must be ADMIN role AND company must have AI subscription)
 */
export async function canUseAI(userId: number, companyId: number): Promise<boolean> {
  try {
    // Check if company has AI subscription
    const hasAI = await hasAIAccess(companyId);
    if (!hasAI) {
      return false;
    }

    // Check if user is ADMIN role in this company
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!membership || !membership.isActive) {
      return false;
    }

    // Only ADMIN role can use AI
    // Backward compatibility: OWNER is also allowed (will be migrated to ADMIN)
    return membership.role === "ADMIN" || membership.role === "OWNER";
  } catch (error) {
    logger.error("Error checking AI access", error, "Subscription");
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
  return paid ? Infinity : 5;
}

