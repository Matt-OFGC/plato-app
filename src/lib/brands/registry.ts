/**
 * Brand registry - central place to manage all brands
 */

import type { Brand, BrandConfig } from "./types";
import { platoConfig } from "./plato";
import { platoBakeConfig } from "./plato-bake";

const brandRegistry: Record<Brand, BrandConfig> = {
  plato: platoConfig,
  plato_bake: platoBakeConfig,
};

/**
 * Get brand configuration by brand ID
 */
export function getBrandConfig(brand: Brand): BrandConfig {
  return brandRegistry[brand];
}

/**
 * Get all available brands
 */
export function getAllBrands(): BrandConfig[] {
  return Object.values(brandRegistry);
}

/**
 * Check if a brand exists
 */
export function brandExists(brand: string): brand is Brand {
  return brand in brandRegistry;
}

/**
 * Get brand config by route path
 */
export function getBrandByRoute(path: string): BrandConfig | null {
  if (path.startsWith("/bake")) {
    return platoBakeConfig;
  }
  return platoConfig; // Default to main Plato
}

