/**
 * Entitlements System
 * Controls which modules/features companies can access
 */

import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export enum AppModule {
  RECIPES = 'RECIPES',
  STAFF = 'STAFF',
  WHOLESALE = 'WHOLESALE',
  MESSAGING = 'MESSAGING',
  ANALYTICS = 'ANALYTICS',
}

export interface EntitlementCheck {
  hasAccess: boolean;
  reason?: string;
  isTrial?: boolean;
  trialEndsAt?: Date;
}

/**
 * Check if a company has access to a specific module
 */
export async function checkEntitlement(
  companyId: number,
  module: AppModule
): Promise<EntitlementCheck> {
  try {
    const entitlement = await prisma.companyEntitlement.findUnique({
      where: {
        companyId_module: {
          companyId,
          module: module as any,
        },
      },
    });

    if (!entitlement) {
      return {
        hasAccess: false,
        reason: 'Module not enabled for this company',
      };
    }

    if (!entitlement.isEnabled) {
      return {
        hasAccess: false,
        reason: 'Module is disabled',
      };
    }

    // Check trial expiration
    if (entitlement.isTrial && entitlement.trialEndsAt) {
      if (new Date() > entitlement.trialEndsAt) {
        return {
          hasAccess: false,
          reason: 'Trial expired',
          isTrial: true,
          trialEndsAt: entitlement.trialEndsAt,
        };
      }
    }

    return {
      hasAccess: true,
      isTrial: entitlement.isTrial,
      trialEndsAt: entitlement.trialEndsAt ?? undefined,
    };
  } catch (error) {
    console.error('Failed to check entitlement:', error);
    return {
      hasAccess: false,
      reason: 'Error checking entitlement',
    };
  }
}

/**
 * Get all entitlements for a company
 */
export async function getCompanyEntitlements(companyId: number) {
  return prisma.companyEntitlement.findMany({
    where: { companyId },
  });
}

/**
 * Enable a module for a company (with optional trial)
 */
export async function enableModule(
  companyId: number,
  module: AppModule,
  options?: {
    isTrial?: boolean;
    trialDays?: number;
    maxUsers?: number;
    maxRecords?: number;
    enabledBy?: number;
    notes?: string;
  }
) {
  const data: any = {
    companyId,
    module,
    isEnabled: true,
    isTrial: options?.isTrial ?? false,
    maxUsers: options?.maxUsers,
    maxRecords: options?.maxRecords,
    enabledBy: options?.enabledBy,
    notes: options?.notes,
  };

  if (options?.isTrial && options?.trialDays) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + options.trialDays);
    data.trialEndsAt = trialEnd;
  }

  return prisma.companyEntitlement.upsert({
    where: {
      companyId_module: {
        companyId,
        module: module as any,
      },
    },
    create: data,
    update: data,
  });
}

/**
 * Disable a module for a company
 */
export async function disableModule(companyId: number, module: AppModule) {
  return prisma.companyEntitlement.update({
    where: {
      companyId_module: {
        companyId,
        module: module as any,
      },
    },
    data: {
      isEnabled: false,
    },
  });
}

/**
 * Initialize default entitlements for a new company
 * By default, give them access to Recipes (core) + 14-day trials for others
 */
export async function initializeCompanyEntitlements(companyId: number) {
  const modules = [
    { module: AppModule.RECIPES, isTrial: false }, // Core module - always on
    { module: AppModule.STAFF, isTrial: true, trialDays: 14 },
    { module: AppModule.WHOLESALE, isTrial: true, trialDays: 14 },
    { module: AppModule.MESSAGING, isTrial: true, trialDays: 14 },
  ];

  return Promise.all(
    modules.map((m) =>
      enableModule(companyId, m.module, {
        isTrial: m.isTrial,
        trialDays: m.trialDays,
      })
    )
  );
}
