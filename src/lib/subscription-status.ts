import { prisma } from "./prisma";
import { logger } from "./logger";
import { getUserSubscription } from "./subscription";
import { hasAIAccess, getAISubscriptionType, getIngredientLimit, getRecipeLimit } from "./subscription-simple";

export interface SubscriptionStatusPayload {
  subscription: {
    tier: string;
    status?: string | null;
    endsAt?: Date | string | null;
    interval?: string | null;
    subscription?: any;
    limits: {
      maxIngredients: number | null;
      maxRecipes: number | null;
    };
  } | null;
  aiSubscription: {
    active: boolean;
    type: string;
  } | null;
  user: {
    id: number;
    email: string;
    subscriptionTier: string | null;
    subscriptionStatus: string | null;
    subscriptionEndsAt: Date | string | null;
    subscriptionInterval?: string | null;
  };
}

/**
 * Build a normalized subscription status payload used by both the API route and the server page.
 */
export async function buildSubscriptionStatusPayload(userId: number, companyId?: number | null): Promise<SubscriptionStatusPayload> {
  // Fetch the user first to ensure we have subscription fields
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      subscriptionInterval: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Parallelize subscription, limits, and AI access lookups
  const [subscriptionResult, limitsResult, aiAccessResult] = await Promise.allSettled([
    getUserSubscription(user.id),
    (async () => {
      const [ingredientLimit, recipeLimit] = await Promise.all([
        getIngredientLimit(user.id),
        getRecipeLimit(user.id),
      ]);

      return {
        maxIngredients: ingredientLimit === Infinity ? null : ingredientLimit,
        maxRecipes: recipeLimit === Infinity ? null : recipeLimit,
      };
    })(),
    companyId ? (async () => {
      const hasAI = await hasAIAccess(companyId);
      if (hasAI) {
        const aiType = await getAISubscriptionType(companyId);
        return {
          active: true,
          type: aiType,
        };
      }
      return null;
    })() : Promise.resolve(null),
  ]);

  const subscription = subscriptionResult.status === "fulfilled" ? subscriptionResult.value : null;
  const limits = limitsResult.status === "fulfilled" ? limitsResult.value : { maxIngredients: null, maxRecipes: null };

  let aiSubscription = null;
  if (aiAccessResult.status === "fulfilled") {
    aiSubscription = aiAccessResult.value;
  } else if (aiAccessResult.status === "rejected") {
    // Log but don't fail the request if AI lookup fails
    logger.warn("Error getting AI subscription", aiAccessResult.reason, "Subscription/Status");
  }

  const normalizedSubscription = subscription
    ? {
        ...subscription,
        limits,
      }
    : {
        tier: user.subscriptionTier || "free",
        status: user.subscriptionStatus || "free",
        endsAt: user.subscriptionEndsAt,
        interval: user.subscriptionInterval,
        subscription: null,
        limits,
      };

  return {
    subscription: normalizedSubscription,
    aiSubscription,
    user: {
      id: user.id,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      subscriptionInterval: user.subscriptionInterval,
    },
  };
}

