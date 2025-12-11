import { prisma } from "@/lib/prisma";

export type CompanyFeature =
  | 'api_access'
  | 'advanced_analytics'
  | 'custom_branding'
  | 'bulk_import'
  | 'advanced_permissions';

/**
 * Check if a company has a specific feature enabled
 */
export async function isCompanyFeatureEnabled(
  companyId: number,
  feature: CompanyFeature
): Promise<boolean> {
  try {
    // Check if CompanyFeatureFlag model exists
    if (!prisma.companyFeatureFlag) {
      // If model doesn't exist, return false for all features
      return false;
    }

    const flag = await prisma.companyFeatureFlag.findUnique({
      where: {
        companyId_feature: {
          companyId,
          feature,
        },
      },
      select: {
        enabled: true,
      },
    });

    return flag?.enabled ?? false;
  } catch (error) {
    // Model doesn't exist or other error
    return false;
  }
}

/**
 * Set a company feature flag
 */
export async function setCompanyFeatureFlag(
  companyId: number,
  feature: CompanyFeature,
  enabled: boolean,
  config?: Record<string, any>
): Promise<void> {
  try {
    // Check if CompanyFeatureFlag model exists
    if (!prisma.companyFeatureFlag) {
      throw new Error('CompanyFeatureFlag model not available');
    }

    await prisma.companyFeatureFlag.upsert({
      where: {
        companyId_feature: {
          companyId,
          feature,
        },
      },
      update: {
        enabled,
        config: config || {},
      },
      create: {
        companyId,
        feature,
        enabled,
        config: config || {},
      },
    });
  } catch (error) {
    throw new Error(`Failed to set feature flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all feature flags for a company
 */
export async function getCompanyFeatureFlags(
  companyId: number
): Promise<Record<string, { enabled: boolean; config?: Record<string, any> }>> {
  try {
    // Check if CompanyFeatureFlag model exists
    if (!prisma.companyFeatureFlag) {
      return {};
    }

    const flags = await prisma.companyFeatureFlag.findMany({
      where: { companyId },
      select: {
        feature: true,
        enabled: true,
        config: true,
      },
    });

    return flags.reduce((acc, flag) => {
      acc[flag.feature] = {
        enabled: flag.enabled,
        config: flag.config as Record<string, any>,
      };
      return acc;
    }, {} as Record<string, { enabled: boolean; config?: Record<string, any> }>);
  } catch (error) {
    // Model doesn't exist or other error
    return {};
  }
}
