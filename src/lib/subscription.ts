import { prisma } from "@/lib/prisma";

// Feature flags for each tier
export const TIER_FEATURES = {
  starter: [],
  professional: ["pdf_export", "analytics", "inventory", "unlimited_recipes", "unlimited_ingredients"],
  team: ["pdf_export", "analytics", "inventory", "unlimited_recipes", "unlimited_ingredients", "team", "production", "device_login"],
  business: ["pdf_export", "analytics", "inventory", "unlimited_recipes", "unlimited_ingredients", "team", "production", "device_login", "wholesale", "advanced_analytics", "unlimited_seats"],
} as const;

export const SUBSCRIPTION_LIMITS = {
  starter: {
    maxIngredients: 15,
    maxRecipes: 5,
    includedSeats: 1,
    features: TIER_FEATURES.starter,
  },
  professional: {
    maxIngredients: null, // unlimited
    maxRecipes: null, // unlimited
    includedSeats: 1,
    features: TIER_FEATURES.professional,
  },
  team: {
    maxIngredients: null, // unlimited
    maxRecipes: null, // unlimited
    includedSeats: 5,
    features: TIER_FEATURES.team,
  },
  business: {
    maxIngredients: null, // unlimited
    maxRecipes: null, // unlimited
    includedSeats: null, // unlimited
    features: TIER_FEATURES.business,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;
export type Feature = typeof TIER_FEATURES[SubscriptionTier][number];

export interface TierConfig {
  maxIngredients: number | null;
  maxRecipes: number | null;
  includedSeats: number | null;
  features: readonly string[];
}

export interface UsageLimits {
  maxIngredients: number | null;
  maxRecipes: number | null;
  includedSeats: number | null;
}

export interface UserUsage {
  ingredientCount: number;
  recipeCount: number;
  tier: SubscriptionTier;
  limits: UsageLimits;
  features: readonly string[];
}

/**
 * Normalize tier names for backward compatibility
 */
function normalizeTier(tier: string): SubscriptionTier {
  // Map old tier names to new ones
  if (tier === "free") return "starter";
  if (tier === "pro") return "professional";
  
  // Validate new tier names
  if (tier === "starter" || tier === "professional" || tier === "team" || tier === "business") {
    return tier;
  }
  
  // Default to starter for unknown tiers
  return "starter";
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

  // Normalize tier for backward compatibility
  const tier = normalizeTier(user.subscriptionTier);
  const limits = SUBSCRIPTION_LIMITS[tier];

  return {
    ingredientCount: user.ingredientCount,
    recipeCount: user.recipeCount,
    tier,
    limits: {
      maxIngredients: limits.maxIngredients,
      maxRecipes: limits.maxRecipes,
      includedSeats: limits.includedSeats,
    },
    features: limits.features,
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeature(userId: number, feature: string): Promise<boolean> {
  const usage = await getUserSubscription(userId);
  if (!usage) return false;
  
  return usage.features.includes(feature);
}

/**
 * Check if user can access wholesale features (Business tier only)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  return await hasFeature(userId, "wholesale");
}

/**
 * Check if user can access production planning (Team tier and above)
 */
export async function canAccessProduction(userId: number): Promise<boolean> {
  return await hasFeature(userId, "production");
}

/**
 * Check if user can invite team members (Team tier and above)
 */
export async function canInviteTeamMembers(userId: number): Promise<boolean> {
  return await hasFeature(userId, "team");
}

/**
 * Get the number of included seats for a user's tier
 */
export async function getIncludedSeats(userId: number): Promise<number | null> {
  const usage = await getUserSubscription(userId);
  if (!usage) return 1;
  
  return usage.limits.includedSeats;
}

/**
 * Check if user can add more ingredients
 */
export async function canAddIngredient(userId: number): Promise<boolean> {
  const usage = await getUserSubscription(userId);
  if (!usage) return false;

  // If unlimited (professional, team, business tiers), always allow
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

  // If unlimited (professional, team, business tiers), always allow
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
  const tier = normalizeTier(user.subscriptionTier);
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

/**
 * Get tier display information
 */
export function getTierInfo(tier: SubscriptionTier) {
  const tierInfo = {
    starter: {
      name: "Starter",
      price: 0,
      priceAnnual: 0,
      description: "Perfect for home cooks and small kitchens",
    },
    professional: {
      name: "Professional",
      price: 19,
      priceAnnual: 15,
      description: "Ideal for professional chefs and restaurants",
    },
    team: {
      name: "Team",
      price: 59,
      priceAnnual: 47,
      description: "For growing food businesses with teams",
    },
    business: {
      name: "Business",
      price: 149,
      priceAnnual: 119,
      description: "For established wholesale operations",
    },
  };

  return tierInfo[tier];
}

/**
 * Create a feature gate error response for API routes
 */
export function createFeatureGateError(
  requiredTier: SubscriptionTier,
  currentTier: SubscriptionTier,
  feature: string
) {
  const tierInfo = getTierInfo(requiredTier);
  
  return {
    error: "Feature not available",
    requiredTier,
    currentTier,
    feature,
    message: `${feature} requires ${tierInfo.name} plan`,
    upgradeUrl: `/pricing?highlight=${requiredTier}`,
  };
}
