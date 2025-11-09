import { prisma } from "@/lib/prisma";

export type FeatureModuleName = "recipes" | "production" | "make" | "teams" | "safety";

/**
 * Check if a user has access to a specific section/module
 * Returns true if unlocked (paid) or on trial (Recipes only)
 */
export async function checkSectionAccess(
  userId: number,
  sectionName: FeatureModuleName
): Promise<boolean> {
  try {
    const module = await prisma.featureModule.findUnique({
      where: {
        userId_moduleName: {
          userId,
          moduleName: sectionName,
        },
      },
    });

    if (!module) {
      // Recipes has free trial by default - auto-initialize if not exists
      if (sectionName === "recipes") {
        await initializeRecipesTrial(userId);
        return true; // Trial is active
      }
      console.log(`[checkSectionAccess] Module ${sectionName} not found for user ${userId}`);
      return false; // Other sections require purchase
    }

    // Check if module is active (not canceled)
    const hasAccess = module.status === "active" || module.status === "trialing";
    console.log(`[checkSectionAccess] User ${userId}, module ${sectionName}: status=${module.status}, hasAccess=${hasAccess}`);
    return hasAccess;
  } catch (error) {
    console.error(`[checkSectionAccess] Error checking access for user ${userId}, module ${sectionName}:`, error);
    return false;
  }
}

/**
 * Get all unlocked sections for a user (paid + trial)
 */
export async function getUnlockedSections(userId: number): Promise<FeatureModuleName[]> {
  const modules = await prisma.featureModule.findMany({
    where: {
      userId,
      status: {
        in: ["active", "trialing"],
      },
    },
  });

  return modules.map((m) => m.moduleName as FeatureModuleName);
}

/**
 * Check if Recipes module is in trial mode
 */
export async function isRecipesTrial(userId: number): Promise<boolean> {
  const module = await prisma.featureModule.findUnique({
    where: {
      userId_moduleName: {
        userId,
        moduleName: "recipes",
      },
    },
  });

  if (!module) {
    // Auto-initialize trial
    await initializeRecipesTrial(userId);
    return true;
  }

  return module.isTrial === true && (module.status === "active" || module.status === "trialing");
}

/**
 * Check Recipes trial limits against actual usage
 * Returns { withinLimit: boolean, ingredientsUsed: number, ingredientsLimit: number, recipesUsed: number, recipesLimit: number }
 */
export async function checkRecipesLimits(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ingredientCount: true,
      recipeCount: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Default trial limits: 10 ingredients, 5 recipes
  const ingredientsLimit = 10;
  const recipesLimit = 5;
  const ingredientsUsed = user.ingredientCount ?? 0;
  const recipesUsed = user.recipeCount ?? 0;

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
 * Initialize Recipes trial for a user (call on signup or first access)
 */
export async function initializeRecipesTrial(userId: number): Promise<void> {
  // Check if already exists
  const existing = await prisma.featureModule.findUnique({
    where: {
      userId_moduleName: {
        userId,
        moduleName: "recipes",
      },
    },
  });

  if (existing) {
    return; // Already initialized
  }

  // Create trial module
  await prisma.featureModule.create({
    data: {
      userId,
      moduleName: "recipes",
      status: "trialing",
      isTrial: true,
      unlockedAt: new Date(),
    },
  });

  // Note: User limits are handled by the FeatureModule system
  // No need to update User model fields that don't exist
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
    throw new Error(`Access denied: ${sectionName} module not unlocked`);
  }
}

/**
 * Get detailed unlock status for all sections
 */
export async function getUnlockStatus(userId: number) {
  try {
    const modules = await prisma.featureModule.findMany({
      where: { userId },
    });

    // Debug logging - enhanced
    console.log(`[getUnlockStatus] User ${userId} - Found ${modules.length} modules:`, modules.map(m => ({
      moduleName: m.moduleName,
      status: m.status,
      isTrial: m.isTrial,
      unlockedAt: m.unlockedAt,
      isActive: m.status === "active" || m.status === "trialing"
    })));

    const moduleMap = new Map(
      modules.map((m) => {
        const isActive = m.status === "active" || m.status === "trialing";
        console.log(`[getUnlockStatus] Mapping module ${m.moduleName}: status=${m.status}, isActive=${isActive}`);
        return [m.moduleName, { ...m, isActive }];
      })
    );

    // Check if Recipes trial exists, if not initialize it
    if (!moduleMap.has("recipes")) {
      console.log(`[getUnlockStatus] Recipes module not found, initializing trial for user ${userId}`);
      await initializeRecipesTrial(userId);
      const recipesModule = await prisma.featureModule.findUnique({
        where: {
          userId_moduleName: {
            userId,
            moduleName: "recipes",
          },
        },
      });
      if (recipesModule) {
        moduleMap.set("recipes", { ...recipesModule, isActive: true });
        console.log(`[getUnlockStatus] Recipes trial initialized for user ${userId}`);
      }
    }

    const allModules: FeatureModuleName[] = ["recipes", "production", "make", "teams", "safety"];

    const result = {
      recipes: {
        unlocked: moduleMap.get("recipes")?.isActive ?? true, // Default to true (trial)
        isTrial: moduleMap.get("recipes")?.isTrial ?? true,
        status: moduleMap.get("recipes")?.status ?? "trialing",
      },
      production: {
        unlocked: moduleMap.get("production")?.isActive ?? false,
        isTrial: false,
        status: moduleMap.get("production")?.status ?? null,
      },
      make: {
        unlocked: moduleMap.get("make")?.isActive ?? false,
        isTrial: false,
        status: moduleMap.get("make")?.status ?? null,
      },
      teams: {
        unlocked: moduleMap.get("teams")?.isActive ?? false,
        isTrial: false,
        status: moduleMap.get("teams")?.status ?? null,
      },
      safety: {
        unlocked: moduleMap.get("safety")?.isActive ?? false,
        isTrial: false,
        status: moduleMap.get("safety")?.status ?? null,
      },
    };

    // Log final result for debugging
    console.log(`[getUnlockStatus] Final result for user ${userId}:`, JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error(`[getUnlockStatus] Error getting unlock status for user ${userId}:`, error);
    // Return default locked status on error
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
  }
}

