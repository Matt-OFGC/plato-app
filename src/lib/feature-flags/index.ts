/**
 * Feature Flags System
 * Granular control over features, with gradual rollout support
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * Check if a feature is enabled for a company
 * Supports gradual rollout via rolloutPercentage
 */
export async function isFeatureEnabled(
  key: string,
  companyId?: number
): Promise<boolean> {
  try {
    // Check company-specific flag first
    if (companyId) {
      const companyFlag = await prisma.featureFlag.findUnique({
        where: {
          key_companyId: {
            key,
            companyId,
          },
        },
      });

      if (companyFlag) {
        return checkRollout(companyFlag.isEnabled, companyFlag.rolloutPercentage, companyId);
      }
    }

    // Fall back to global flag
    const globalFlag = await prisma.featureFlag.findUnique({
      where: {
        key_companyId: {
          key,
          companyId: null as any,
        },
      },
    });

    if (globalFlag) {
      return checkRollout(
        globalFlag.isEnabled,
        globalFlag.rolloutPercentage,
        companyId ?? 0
      );
    }

    // Default to disabled if flag doesn't exist
    return false;
  } catch (error) {
    console.error('Failed to check feature flag:', error);
    return false;
  }
}

/**
 * Determine if feature should be enabled based on rollout percentage
 * Uses company ID hash for consistent rollout
 */
function checkRollout(
  isEnabled: boolean,
  rolloutPercentage: number,
  companyId: number
): boolean {
  if (!isEnabled) return false;
  if (rolloutPercentage >= 100) return true;

  // Use company ID to determine bucket (0-99)
  const bucket = companyId % 100;
  return bucket < rolloutPercentage;
}

/**
 * Create or update a feature flag
 */
export async function setFeatureFlag(
  key: string,
  options: {
    name: string;
    description?: string;
    isEnabled: boolean;
    companyId?: number;
    rolloutPercentage?: number;
  }
) {
  return prisma.featureFlag.upsert({
    where: {
      key_companyId: {
        key,
        companyId: options.companyId ?? (null as any),
      },
    },
    create: {
      key,
      name: options.name,
      description: options.description,
      isEnabled: options.isEnabled,
      companyId: options.companyId,
      rolloutPercentage: options.rolloutPercentage ?? 100,
    },
    update: {
      name: options.name,
      description: options.description,
      isEnabled: options.isEnabled,
      rolloutPercentage: options.rolloutPercentage ?? 100,
    },
  });
}

/**
 * Enable a feature flag
 */
export async function enableFeature(key: string, companyId?: number) {
  return prisma.featureFlag.update({
    where: {
      key_companyId: {
        key,
        companyId: companyId ?? (null as any),
      },
    },
    data: {
      isEnabled: true,
    },
  });
}

/**
 * Disable a feature flag
 */
export async function disableFeature(key: string, companyId?: number) {
  return prisma.featureFlag.update({
    where: {
      key_companyId: {
        key,
        companyId: companyId ?? (null as any),
      },
    },
    data: {
      isEnabled: false,
    },
  });
}

/**
 * Gradual rollout - increase percentage over time
 */
export async function updateRolloutPercentage(
  key: string,
  percentage: number,
  companyId?: number
) {
  return prisma.featureFlag.update({
    where: {
      key_companyId: {
        key,
        companyId: companyId ?? (null as any),
      },
    },
    data: {
      rolloutPercentage: Math.max(0, Math.min(100, percentage)),
    },
  });
}

/**
 * Get all feature flags (for admin dashboard)
 */
export async function getAllFeatureFlags(companyId?: number) {
  return prisma.featureFlag.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { key: 'asc' },
  });
}

// Predefined feature flag keys (for type safety)
export const FeatureFlags = {
  // Staff module
  STAFF_SCHEDULER_DRAG_DROP: 'staff.scheduler.drag_drop',
  STAFF_SCHEDULER_TEMPLATES: 'staff.scheduler.templates',
  STAFF_AUTO_CONFLICT_DETECTION: 'staff.auto_conflict_detection',
  STAFF_PAYROLL_INTEGRATION: 'staff.payroll_integration',

  // Wholesale module
  WHOLESALE_AUTO_PRICE_SYNC: 'wholesale.auto_price_sync',
  WHOLESALE_INVENTORY_SYNC: 'wholesale.inventory_sync',
  WHOLESALE_CSV_IMPORT: 'wholesale.csv_import',

  // Messaging module
  MESSAGING_FILE_UPLOADS: 'messaging.file_uploads',
  MESSAGING_VIDEO_CALLS: 'messaging.video_calls',

  // Analytics
  ANALYTICS_ADVANCED_REPORTS: 'analytics.advanced_reports',
  ANALYTICS_EXPORT_PDF: 'analytics.export_pdf',
} as const;
