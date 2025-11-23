/**
 * Brand detection and utilities
 */

import { prisma } from "./prisma";
import type { Brand } from "@/lib/brands/types";
import { getBrandConfig } from "@/lib/brands/registry";
import type { BrandConfig } from "@/lib/brands/types";

/**
 * Get brand for a company
 * Note: Company model uses 'app' field, not 'brand' field
 */
export async function getCompanyBrand(companyId: number): Promise<Brand | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { app: true },
    });
    // Map app to brand (they're the same concept)
    return (company?.app as Brand | null) || null;
  } catch (error) {
    console.error(`[getCompanyBrand] Error getting brand for company ${companyId}:`, error);
    return null;
  }
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
export async function isPlatoBake(companyId: number): Promise<boolean> {
  return isBrand(companyId, "plato_bake");
}

/**
 * Get brand theme colors for a company
 */
export async function getBrandTheme(companyId: number) {
  const config = await getBrandConfigForCompany(companyId);
  return config?.colors || null;
}

