import { prisma } from "@/lib/prisma";

export const SUBSCRIPTION_LIMITS = {
  free: {
    maxIngredients: 15,
    maxRecipes: 5,
  },
  pro: {
    maxIngredients: null, // unlimited
    maxRecipes: null, // unlimited
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

export interface UsageLimits {
  maxIngredients: number | null;
  maxRecipes: number | null;
}

export interface UserUsage {
  ingredientCount: number;
  recipeCount: number;
  tier: SubscriptionTier;
  limits: UsageLimits;
}

/**
 * Get user's current subscription tier and usage limits
 */
export async function getUserSubscription(userId: number): Promise<UserUsage | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
    },
  });

  if (!user) return null;

  // Determine current tier
  const tier: SubscriptionTier = user.subscriptionTier === "pro" ? "pro" : "free";
  const limits = SUBSCRIPTION_LIMITS[tier];

  return {
    ingredientCount: user.ingredientCount,
    recipeCount: user.recipeCount,
    tier,
    limits,
  };
}

/**
 * Check if user can add more ingredients
 */
export async function canAddIngredient(userId: number): Promise<boolean> {
  const usage = await getUserSubscription(userId);
  if (!usage) return false;

  // If unlimited (pro tier), always allow
  if (usage.limits.maxIngredients === null) return true;

  // Check if under limit
  return usage.ingredientCount < usage.limits.maxIngredients;
}

/**
 * Check if user can add more recipes
 */
export async function canAddRecipe(userId: number): Promise<boolean> {
  const usage = await getUserSubscription(userId);
  if (!usage) return false;

  // If unlimited (pro tier), always allow
  if (usage.limits.maxRecipes === null) return true;

  // Check if under limit
  return usage.recipeCount < usage.limits.maxRecipes;
}

/**
 * Update user's ingredient count
 */
export async function updateIngredientCount(userId: number, delta: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ingredientCount: {
        increment: delta,
      },
    },
  });
}

/**
 * Update user's recipe count
 */
export async function updateRecipeCount(userId: number, delta: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      recipeCount: {
        increment: delta,
      },
    },
  });
}

/**
 * Get subscription status for display
 */
export function getSubscriptionStatus(user: any): {
  tier: SubscriptionTier;
  status: string;
  isActive: boolean;
  expiresAt?: Date;
} {
  const tier: SubscriptionTier = user.subscriptionTier === "pro" ? "pro" : "free";
  const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "free";
  
  return {
    tier,
    status: user.subscriptionStatus,
    isActive,
    expiresAt: user.subscriptionEndsAt,
  };
}

/**
 * Check if user has reached their limits
 */
export async function checkUsageLimits(userId: number): Promise<{
  canAddIngredient: boolean;
  canAddRecipe: boolean;
  usage: UserUsage | null;
}> {
  const usage = await getUserSubscription(userId);
  if (!usage) {
    return {
      canAddIngredient: false,
      canAddRecipe: false,
      usage: null,
    };
  }

  return {
    canAddIngredient: await canAddIngredient(userId),
    canAddRecipe: await canAddRecipe(userId),
    usage,
  };
}

