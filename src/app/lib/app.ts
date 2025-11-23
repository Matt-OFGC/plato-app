/**
 * App detection and utilities
 */

import { prisma } from "./prisma";
import type { App } from "@/lib/apps/types";
import { getAppConfig } from "@/lib/apps/registry";
import type { AppConfig } from "@/lib/apps/types";

/**
 * Get app for a company
 */
export async function getCompanyApp(companyId: number): Promise<App | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { app: true },
    });
    return company?.app || null;
  } catch (error) {
    console.error(`[getCompanyApp] Error getting app for company ${companyId}:`, error);
    return null;
  }
}

/**
 * Get full app configuration for a company
 */
export async function getAppConfigForCompany(companyId: number): Promise<AppConfig | null> {
  const app = await getCompanyApp(companyId);
  if (!app) {
    return null;
  }
  return getAppConfig(app);
}

/**
 * Check if company is a specific app
 */
export async function isApp(companyId: number, app: App): Promise<boolean> {
  const companyApp = await getCompanyApp(companyId);
  return companyApp === app;
}

/**
 * Check if company is Plato Bake
 */
export async function isPlatoBake(companyId: number): Promise<boolean> {
  return isApp(companyId, "plato_bake");
}

/**
 * Get app theme colors for a company
 */
export async function getAppTheme(companyId: number) {
  const config = await getAppConfigForCompany(companyId);
  return config ? {
    primary: config.primaryColor,
    accent: config.accentColor,
    secondary: config.secondaryColor,
  } : null;
}

