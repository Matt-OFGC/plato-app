/**
 * Feature flag system for gradual rollouts and A/B testing
 */

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number; // 0-100
}

// Feature flags configuration
const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  AUTO_REPAIR: {
    name: 'AUTO_REPAIR',
    enabled: true,
    description: 'Automatically repair orphaned users and inactive memberships',
    rolloutPercentage: 100,
  },
  AUTO_REPAIR_CREATE_COMPANY: {
    name: 'AUTO_REPAIR_CREATE_COMPANY',
    enabled: true,
    description: 'Auto-create company for orphaned users',
    rolloutPercentage: 100,
  },
  AUTO_REPAIR_ACTIVATE_MEMBERSHIP: {
    name: 'AUTO_REPAIR_ACTIVATE_MEMBERSHIP',
    enabled: true,
    description: 'Auto-activate inactive memberships',
    rolloutPercentage: 100,
  },
  ENHANCED_ERROR_MESSAGES: {
    name: 'ENHANCED_ERROR_MESSAGES',
    enabled: true,
    description: 'Show detailed error messages with error IDs',
    rolloutPercentage: 100,
  },
  REQUEST_ID_TRACKING: {
    name: 'REQUEST_ID_TRACKING',
    enabled: true,
    description: 'Track requests with unique IDs for debugging',
    rolloutPercentage: 100,
  },
};

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagName: string, userId?: number): boolean {
  const flag = FEATURE_FLAGS[flagName];
  
  if (!flag) {
    // Unknown flags default to false for safety
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  // If rollout percentage is set, check if user is in rollout group
  if (flag.rolloutPercentage !== undefined && userId !== undefined) {
    // Use userId to deterministically assign user to rollout group
    const userGroup = (userId % 100) + 1;
    return userGroup <= flag.rolloutPercentage;
  }

  return true;
}

/**
 * Get feature flag configuration
 */
export function getFeatureFlag(flagName: string): FeatureFlag | null {
  return FEATURE_FLAGS[flagName] || null;
}

/**
 * Get all feature flags (for admin dashboard)
 */
export function getAllFeatureFlags(): FeatureFlag[] {
  return Object.values(FEATURE_FLAGS);
}

/**
 * Update feature flag (admin only - should be persisted to database in production)
 */
export function updateFeatureFlag(
  flagName: string,
  updates: Partial<FeatureFlag>
): void {
  if (FEATURE_FLAGS[flagName]) {
    FEATURE_FLAGS[flagName] = {
      ...FEATURE_FLAGS[flagName],
      ...updates,
    };
  }
}
