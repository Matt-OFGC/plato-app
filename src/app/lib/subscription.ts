/**
 * Legacy subscription utilities for backwards compatibility
 * These functions check tier-based access but will be deprecated
 * New code should use lib/features.ts instead
 */

import { prisma } from "@/lib/prisma";
import { checkSectionAccess } from "./features";

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
 * NEW: Checks if user has Wholesale features (part of Business tier, but we'll check Production/Business for now)
 */
export async function canAccessWholesale(userId: number): Promise<boolean> {
  // For now, wholesale is part of Production module
  // In future, might be separate module
  return checkSectionAccess(userId, "production");
}

/**
 * Legacy: Create feature gate error response
 */
export function createFeatureGateError(
  requiredTier: string,
  currentTier: string,
  featureName: string
) {
  return {
    error: "Feature not available",
    code: "FEATURE_GATED",
    requiredTier,
    currentTier,
    featureName,
    message: `${featureName} requires ${requiredTier} tier. You currently have ${currentTier} tier.`,
  };
}

