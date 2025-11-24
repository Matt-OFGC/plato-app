/**
 * Stripe price ID mappings for feature modules
 * These should be set in your environment variables
 */

export type FeatureModuleName = "recipes" | "production" | "make" | "teams" | "safety" | "mentor";

export interface FeatureModuleConfig {
  name: string;
  priceMonthly: number;
  stripePriceIdMonthly?: string;
  description: string;
  benefits: string[];
}

export const FEATURE_MODULES: Record<FeatureModuleName, FeatureModuleConfig> = {
  recipes: {
    name: "Recipes",
    priceMonthly: 10,
    stripePriceIdMonthly: process.env.STRIPE_RECIPES_MONTHLY_PRICE_ID,
    description: "Create unlimited recipes with cost tracking, scaling, and more",
    benefits: [
      "Unlimited recipes",
      "Unlimited ingredients",
      "Advanced cost calculations",
      "Recipe scaling and batch planning",
      "PDF export",
      "Recipe collections",
    ],
  },
  production: {
    name: "Production Detail",
    priceMonthly: 15,
    stripePriceIdMonthly: process.env.STRIPE_PRODUCTION_MONTHLY_PRICE_ID,
    description: "Plan and manage production schedules with team assignments",
    benefits: [
      "Production planning",
      "Schedule management",
      "Team assignments",
      "Shopping lists",
      "Production history",
      "Analytics and insights",
    ],
  },
  make: {
    name: "Make",
    priceMonthly: 5,
    stripePriceIdMonthly: process.env.STRIPE_MAKE_MONTHLY_PRICE_ID,
    description: "Generate labels and sales sheets for your products",
    benefits: [
      "Label generation",
      "Sales sheets",
      "Allergen sheets",
      "Custom templates",
      "Bulk printing",
    ],
  },
  teams: {
    name: "Teams",
    priceMonthly: 15,
    stripePriceIdMonthly: process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID,
    description: "Manage your team, schedules, training, and communication",
    benefits: [
      "Team management",
      "Shift scheduling",
      "Training modules",
      "Staff profiles",
      "Timesheets",
      "Team messaging",
    ],
  },
  safety: {
    name: "Hygiene & Safety",
    priceMonthly: 15,
    stripePriceIdMonthly: process.env.STRIPE_SAFETY_MONTHLY_PRICE_ID,
    description: "Compliance, safety tasks, temperature tracking, and equipment management",
    benefits: [
      "Safety task templates",
      "Temperature monitoring",
      "Equipment register",
      "Compliance tracking",
      "Safety diary",
      "Automated alerts",
    ],
  },
  mentor: {
    name: "Mentor AI Assistant",
    priceMonthly: 49,
    stripePriceIdMonthly: process.env.STRIPE_MENTOR_MONTHLY_PRICE_ID,
    description: "Your AI business mentor that learns everything about your business and provides intelligent advice",
    benefits: [
      "Unlimited AI conversations",
      "Business insights and advice",
      "Pricing recommendations",
      "Goal tracking and progress",
      "Proactive alerts and reminders",
      "Internet search for industry benchmarks",
      "Personalized learning paths",
    ],
  },
};

/**
 * Get Stripe price ID for a module
 */
export function getModuleStripePriceId(moduleName: FeatureModuleName): string | undefined {
  return FEATURE_MODULES[moduleName].stripePriceIdMonthly;
}

/**
 * Get module config by Stripe price ID (for webhook processing)
 */
export function getModuleFromStripePriceId(priceId: string): FeatureModuleName | null {
  for (const [moduleName, config] of Object.entries(FEATURE_MODULES)) {
    if (config.stripePriceIdMonthly === priceId) {
      return moduleName as FeatureModuleName;
    }
  }
  return null;
}

