import { prisma } from "@/lib/prisma";
import { getCurrentUserAndCompany } from "./current";

export type FeatureModuleName = "recipes" | "production" | "make" | "teams" | "safety";

/**
 * Unlock status for a single module
 */
export type ModuleUnlockStatus = {
  unlocked: boolean;
  isTrial: boolean;
  status: string | null;
};

/**
 * Unlock status for all modules
 */
export type UnlockStatus = {
  recipes: ModuleUnlockStatus;
  production: ModuleUnlockStatus;
  make: ModuleUnlockStatus;
  teams: ModuleUnlockStatus;
  safety: ModuleUnlockStatus;
};

/**
 * Check if user has paid subscription tier
 */
export async function isPaidTier(userId: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) {
    console.log(`[isPaidTier] User ${userId} not found`);
    return false;
  }

  // Paid tier: "paid" (simple free/paid system)
  const tierLower = user.subscriptionTier?.toLowerCase() || "";
  const isPaid = tierLower === "paid";

  console.log(`[isPaidTier] User ${userId} check:`, {
    subscriptionTier: user.subscriptionTier,
    tierLower,
    isPaid,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
  });

  // If not a paid tier, return false
  if (!isPaid) {
    console.log(`[isPaidTier] User ${userId} is not on a paid tier`);
    return false;
  }

  // Check if subscription is still active
  if (user.subscriptionEndsAt) {
    const now = new Date();
    const endsAt = new Date(user.subscriptionEndsAt);
    const isActive = endsAt > now;
    console.log(`[isPaidTier] User ${userId} date check:`, {
      now: now.toISOString(),
      endsAt: endsAt.toISOString(),
      isActive,
    });
    return isActive;
  }

  // If no end date, check status
  const isActive = user.subscriptionStatus === "active";
  console.log(`[isPaidTier] User ${userId} status check:`, {
    subscriptionStatus: user.subscriptionStatus,
    isActive,
  });
  return isActive;
}

/**
 * Check if a user has access to a specific section/module
 * Free tier: Only recipes (with limits)
 * Paid tier: Check user's app subscriptions to determine which features are available
 * Each app has its own feature set (e.g., Plato Bake: recipes, production, make)
 */
export async function checkSectionAccess(
  userId: number,
  sectionName: FeatureModuleName
): Promise<boolean> {
  try {
    const paid = await isPaidTier(userId);

    // Free tier: Only recipes unlocked (with limits)
    if (!paid) {
      return sectionName === "recipes";
    }

    // Paid tier: Check user's app subscriptions
    try {
      const { getUserApps } = await import("./user-app-subscriptions");
      const { getAppConfig } = await import("@/lib/apps/registry");
      
      const userApps = await getUserApps(userId);
      
      // If user has no app subscriptions, allow access to everything (backward compatible)
      if (userApps.length === 0) {
        return true;
      }
      
      // Check if any of the user's apps includes this feature
      for (const app of userApps) {
        const appConfig = getAppConfig(app);
        if (appConfig.features.includes(sectionName)) {
          return true;
        }
      }
      
      // User doesn't have access to this feature through any of their apps
      return false;
    } catch (appError) {
      // If app check fails, fallback to allowing access (backward compatible)
      console.warn(`[checkSectionAccess] App check failed for user ${userId}, allowing access:`, appError);
      return true;
    }
  } catch (error) {
    console.error(`[checkSectionAccess] Error checking access for user ${userId}, section ${sectionName}:`, error);
    return false;
  }
}

/**
 * Get all unlocked sections for a user
 */
export async function getUnlockedSections(userId: number): Promise<FeatureModuleName[]> {
  const paid = await isPaidTier(userId);

  if (!paid) {
    // Free tier: Only recipes
    return ["recipes"];
  }

  // Paid tier: Get all features from user's app subscriptions
  try {
    const { getUserApps } = await import("./user-app-subscriptions");
    const { getAppConfig } = await import("./apps/registry");
    
    const userApps = await getUserApps(userId);
    
    // If user has no app subscriptions, return all features (backward compatible)
    if (userApps.length === 0) {
      return ["recipes", "production", "make", "teams", "safety"];
    }
    
    // Collect all unique features from all user's apps
    const allFeatures = new Set<FeatureModuleName>();
    for (const app of userApps) {
      const appConfig = getAppConfig(app);
      appConfig.features.forEach((feature) => allFeatures.add(feature));
    }
    
    return Array.from(allFeatures);
  } catch (appError) {
    // If app check fails, fallback to all features (backward compatible)
    console.warn(`[getUnlockedSections] App check failed for user ${userId}, returning all features:`, appError);
    return ["recipes", "production", "make", "teams", "safety"];
  }
}

/**
 * Check if Recipes is in free trial mode (free tier)
 */
export async function isRecipesTrial(userId: number): Promise<boolean> {
  const paid = await isPaidTier(userId);
  return !paid; // Free tier = trial mode
}

/**
 * Check Recipes limits against actual usage
 * Free tier: 10 ingredients, 2 recipes
 * Paid tier: Unlimited
 */
export async function checkRecipesLimits(userId: number) {
  const paid = await isPaidTier(userId);

  // Paid tier: Unlimited
  if (paid) {
    return {
      withinLimit: true,
      withinIngredientsLimit: true,
      withinRecipesLimit: true,
      ingredientsUsed: 0,
      ingredientsLimit: Infinity,
      recipesUsed: 0,
      recipesLimit: Infinity,
    };
  }

  // Free tier: Get actual counts and check limits
  const [ingredientCount, recipeCount] = await Promise.all([
    prisma.ingredient.count({
      where: {
        company: {
          memberships: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      },
    }),
    prisma.recipe.count({
      where: {
        company: {
          memberships: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      },
    }),
  ]);

  // Free tier limits: 10 ingredients, 2 recipes
  const ingredientsLimit = 10;
  const recipesLimit = 2;
  const ingredientsUsed = ingredientCount;
  const recipesUsed = recipeCount;

  const withinIngredientsLimit = ingredientsUsed < ingredientsLimit;
  const withinRecipesLimit = recipesUsed < recipesLimit;
  const withinLimit = withinIngredientsLimit && withinRecipesLimit;

  return {
    withinLimit,
    withinIngredientsLimit,
    withinRecipesLimit,
    ingredientsUsed,
    ingredientsLimit,
    recipesUsed,
    recipesLimit,
  };
}

/**
 * Route protection helper - throws error if section not accessible
 */
export async function requireSectionAccess(
  userId: number,
  sectionName: FeatureModuleName
): Promise<void> {
  const hasAccess = await checkSectionAccess(userId, sectionName);
  if (!hasAccess) {
    throw new Error(`Access denied: ${sectionName} requires a paid subscription`);
  }
}

/**
 * Get detailed unlock status for all sections based on subscription tier
 */
export async function getUnlockStatus(userId: number): Promise<UnlockStatus> {
  try {
    // Get user subscription info directly - ONLY select fields that exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!user) {
      console.error(`[getUnlockStatus] User ${userId} not found`);
      // Return locked by default if user not found
      return {
        recipes: { unlocked: false, isTrial: false, status: null },
        production: { unlocked: false, isTrial: false, status: null },
        make: { unlocked: false, isTrial: false, status: null },
        teams: { unlocked: false, isTrial: false, status: null },
        safety: { unlocked: false, isTrial: false, status: null },
      };
    }

    // Check if paid tier
    const tierLower = user.subscriptionTier?.toLowerCase() || "";
    const isPaid = tierLower === "paid";
    
    // Also check if subscription is still active (if there's an end date)
    let isActive = true;
    if (user.subscriptionEndsAt) {
      const now = new Date();
      const endsAt = new Date(user.subscriptionEndsAt);
      isActive = endsAt > now;
    } else if (isPaid) {
      // Paid tier without end date should be active if status is active
      isActive = user.subscriptionStatus === "active";
    }

    const paid = isPaid && isActive;

    console.log(`[getUnlockStatus] User ${userId} check:`, {
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      isPaid,
      isActive,
      finalPaid: paid,
    });

    // Paid tier: Check user's app subscriptions
    if (paid) {
      try {
        const { getUserApps } = await import("./user-app-subscriptions");
        const { getAppConfig } = await import("./apps/registry");
        
        const userApps = await getUserApps(userId);
        
        // If user has app subscriptions, only unlock features from those apps
        if (userApps.length > 0) {
          // Collect all unique features from all user's apps
          const allFeatures = new Set<FeatureModuleName>();
          for (const app of userApps) {
            const appConfig = getAppConfig(app);
            appConfig.features.forEach((feature) => allFeatures.add(feature));
          }
          
          const appFeatures = Array.from(allFeatures);
          console.log(`[getUnlockStatus] User ${userId} is PAID with apps ${userApps.join(", ")} - unlocking:`, appFeatures);
          
          return {
            recipes: {
              unlocked: allFeatures.has("recipes"),
              isTrial: false,
              status: allFeatures.has("recipes") ? "active" : null,
            },
            production: {
              unlocked: allFeatures.has("production"),
              isTrial: false,
              status: allFeatures.has("production") ? "active" : null,
            },
            make: {
              unlocked: allFeatures.has("make"),
              isTrial: false,
              status: allFeatures.has("make") ? "active" : null,
            },
            teams: {
              unlocked: allFeatures.has("teams"),
              isTrial: false,
              status: allFeatures.has("teams") ? "active" : null,
            },
            safety: {
              unlocked: allFeatures.has("safety"),
              isTrial: false,
              status: allFeatures.has("safety") ? "active" : null,
            },
          };
        }
        
        // No app subscriptions: Everything unlocked (backward compatible)
        console.log(`[getUnlockStatus] User ${userId} is PAID - unlocking everything`);
        return {
          recipes: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          production: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          make: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          teams: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          safety: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
        };
      } catch (appError) {
        // If app check fails, fallback to unlocking everything (backward compatible)
        console.warn(`[getUnlockStatus] App check failed for user ${userId}, unlocking everything:`, appError);
        return {
          recipes: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          production: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          make: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          teams: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
          safety: {
            unlocked: true,
            isTrial: false,
            status: "active",
          },
        };
      }
    }

    console.log(`[getUnlockStatus] User ${userId} is FREE - only recipes unlocked`);
    // Free tier: Only recipes unlocked (with limits)
    return {
      recipes: {
        unlocked: true,
        isTrial: true,
        status: "trialing",
      },
      production: {
        unlocked: false,
        isTrial: false,
        status: null,
      },
      make: {
        unlocked: false,
        isTrial: false,
        status: null,
      },
      teams: {
        unlocked: false,
        isTrial: false,
        status: null,
      },
      safety: {
        unlocked: false,
        isTrial: false,
        status: null,
      },
    };
  } catch (error) {
    console.error(`[getUnlockStatus] Error getting unlock status for user ${userId}:`, error);
    // On error, return everything unlocked as fallback (safer for user experience)
    console.warn(`[getUnlockStatus] Returning unlocked status due to error`);
    return {
      recipes: {
        unlocked: true,
        isTrial: false,
        status: "active",
      },
      production: {
        unlocked: true,
        isTrial: false,
        status: "active",
      },
      make: {
        unlocked: true,
        isTrial: false,
        status: "active",
      },
      teams: {
        unlocked: true,
        isTrial: false,
        status: "active",
      },
      safety: {
        unlocked: true,
        isTrial: false,
        status: "active",
      },
    };
  }
}
