/**
 * Theme system for app-aware styling
 */

import type { App } from "./apps/types";
import { getAppConfig } from "./apps/registry";

/**
 * Get app colors for a specific app
 */
export function getAppColors(app: App) {
  const config = getAppConfig(app);
  return {
    primary: config.primaryColor,
    accent: config.accentColor,
    secondary: config.secondaryColor,
  };
}

/**
 * Apply app theme to document (for client-side)
 */
export function applyAppTheme(app: App) {
  if (typeof document === "undefined") return;
  
  // Remove existing app classes
  document.documentElement.classList.remove("app-plato", "app-plato-bake");
  
  // Add app-specific class
  if (app === "plato_bake") {
    document.documentElement.classList.add("app-plato-bake");
  } else {
    document.documentElement.classList.add("app-plato");
  }
}

/**
 * Get app CSS class name
 */
export function getAppClass(app: App): string {
  if (app === "plato_bake") {
    return "app-plato-bake";
  }
  return "app-plato";
}

// Legacy exports for backward compatibility (deprecated - use app functions instead)
import type { Brand } from "./brands/types";
import { getBrandConfig } from "./brands/registry";

/**
 * @deprecated Use getAppColors instead
 */
export function getBrandColors(brand: Brand) {
  const config = getBrandConfig(brand);
  return config.colors;
}

/**
 * @deprecated Use applyAppTheme instead
 */
export function applyBrandTheme(brand: Brand) {
  if (typeof document === "undefined") return;
  
  // Remove existing brand classes
  document.documentElement.classList.remove("brand-plato", "brand-plato-bake");
  
  // Add brand-specific class
  if (brand === "plato_bake") {
    document.documentElement.classList.add("brand-plato-bake");
  } else {
    document.documentElement.classList.add("brand-plato");
  }
}

/**
 * @deprecated Use getAppClass instead
 */
export function getBrandClass(brand: Brand): string {
  if (brand === "plato_bake") {
    return "brand-plato-bake";
  }
  return "brand-plato";
}

