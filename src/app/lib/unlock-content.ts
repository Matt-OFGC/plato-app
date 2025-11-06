import React from "react";
import type { FeatureModuleName } from "./stripe-features";

export interface UnlockContent {
  title: string;
  description: string;
  price: string;
  benefits: string[];
  icon: React.ReactNode;
  ctaText?: string;
}

/**
 * Section-specific marketing content for unlock modals
 */
export function getUnlockContent(moduleName: FeatureModuleName): UnlockContent {
  const baseContent = {
    recipes: {
      title: "Unlock Recipes Pro",
      description:
        "Upgrade from your free trial to unlock unlimited recipes and ingredients. Perfect for growing food businesses.",
      price: "£10/month",
      benefits: [
        "Unlimited recipes (beyond 5)",
        "Unlimited ingredients (beyond 10)",
        "Advanced cost calculations",
        "Recipe scaling & batch planning",
        "PDF export functionality",
        "Recipe collections & organization",
      ],
      ctaText: "Upgrade to Recipes Pro",
      icon: (
        <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    production: {
      title: "Unlock Production Detail",
      description:
        "Take control of your production workflow with advanced planning, scheduling, and team management tools.",
      price: "£15/month",
      benefits: [
        "Create production plans",
        "Schedule production days",
        "Assign work to team members",
        "Generate shopping lists",
        "Track production history",
        "Production analytics & insights",
      ],
      ctaText: "Unlock Production Detail",
      icon: (
        <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    make: {
      title: "Unlock Make",
      description:
        "Create professional labels, sales sheets, and allergen information for your products. Essential for retail and wholesale.",
      price: "£5/month",
      benefits: [
        "Generate product labels",
        "Create sales sheets",
        "Allergen information sheets",
        "Custom label templates",
        "Bulk printing capabilities",
        "Brand customization",
      ],
      ctaText: "Unlock Make",
      icon: (
        <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
      ),
    },
    teams: {
      title: "Unlock Teams",
      description:
        "Manage your team efficiently with scheduling, training, staff profiles, and communication tools.",
      price: "£15/month",
      benefits: [
        "Team member management",
        "Shift scheduling & rosters",
        "Training modules & tracking",
        "Staff profiles & performance",
        "Timesheet management",
        "Team messaging & communication",
      ],
      ctaText: "Unlock Teams",
      icon: (
        <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    safety: {
      title: "Unlock Hygiene & Safety",
      description:
        "Stay compliant with automated safety tasks, temperature monitoring, equipment tracking, and compliance reporting.",
      price: "£15/month",
      benefits: [
        "Safety task templates",
        "Temperature monitoring & logging",
        "Equipment register",
        "Compliance tracking",
        "Safety diary & records",
        "Automated alerts & reminders",
      ],
      ctaText: "Unlock Hygiene & Safety",
      icon: (
        <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  };

  return baseContent[moduleName];
}

