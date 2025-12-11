import { prisma } from './prisma';

export interface CompanyFeatureFlag {
  companyId: number;
  feature: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Company-level feature flags
 * Allows enabling/disabling features per company
 */
export async function isCompanyFeatureEnabled(
  companyId: number,
  feature: string
): Promise<boolean> {
  // For now, use a simple in-memory cache
  // In production, this would be stored in database
  
  // Default feature flags per company
  const defaultFlags: Record<string, boolean> = {
    'advanced_analytics': true,
    'ai_suggestions': true,
    'bulk_operations': true,
    'export_data': true,
    'api_access': false, // Disabled by default
  };

  // Check if feature is in defaults
  if (feature in defaultFlags) {
    return defaultFlags[feature];
  }

  // Unknown features default to false
  return false;
}

/**
 * Set company feature flag
 */
export async function setCompanyFeatureFlag(
  companyId: number,
  feature: string,
  enabled: boolean,
  config?: Record<string, any>
): Promise<void> {
  // In production, this would update database
  // For now, we'll just log it
  const logger = (await import('./logger')).logger;
  logger.info(`Company feature flag updated`, {
    companyId,
    feature,
    enabled,
    config,
  }, 'CompanyFeatures');
}

/**
 * Get all feature flags for a company
 */
export async function getCompanyFeatureFlags(
  companyId: number
): Promise<Record<string, boolean>> {
  return {
    'advanced_analytics': await isCompanyFeatureEnabled(companyId, 'advanced_analytics'),
    'ai_suggestions': await isCompanyFeatureEnabled(companyId, 'ai_suggestions'),
    'bulk_operations': await isCompanyFeatureEnabled(companyId, 'bulk_operations'),
    'export_data': await isCompanyFeatureEnabled(companyId, 'export_data'),
    'api_access': await isCompanyFeatureEnabled(companyId, 'api_access'),
  };
}
