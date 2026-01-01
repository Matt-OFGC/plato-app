/**
 * Brand detection and utilities
 */

import { prisma } from "./prisma";
import type { Brand } from "@/lib/brands/types";
import { getBrandConfig } from "@/lib/brands/registry";
import type { BrandConfig } from "@/lib/brands/types";

/**
 * Get brand for a company
 * Note: App field removed from Company model - apps are now user-level subscriptions
 * This function returns null as brands/apps are no longer company-level
 */
export async function getCompanyBrand(companyId: number): Promise<Brand | null> {
  // App field removed - apps are now user-level subscriptions, not company-level
  // Return null as there's no company-level brand/app anymore
  return null;
}

/**
 * Get full brand configuration for a company
 */
export async function getBrandConfigForCompany(companyId: number): Promise<BrandConfig | null> {
  const brand = await getCompanyBrand(companyId);
  if (!brand) {
    return null;
  }
  return getBrandConfig(brand);
}

/**
 * Check if company is a specific brand
 */
export async function isBrand(companyId: number, brand: Brand): Promise<boolean> {
  const companyBrand = await getCompanyBrand(companyId);
  return companyBrand === brand;
}

/**
 * Check if company is Plato Bake
 */
// MVP: plato_bake removed - this function always returns false
export async function isPlatoBake(companyId: number): Promise<boolean> {
  return false;
}

/**
 * Get brand theme colors for a company
 */
export async function getBrandTheme(companyId: number) {
  const config = await getBrandConfigForCompany(companyId);
  return config?.colors || null;
}

