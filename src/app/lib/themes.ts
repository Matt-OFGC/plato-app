/**
 * Theme system for app-aware styling
 */

import type { App } from "@/lib/apps/types";
import { getAppConfig } from "@/lib/apps/registry";

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
  
  // MVP: Only plato app exists - always add plato class
  document.documentElement.classList.add("app-plato");
}

/**
 * Get app CSS class name
 */
export function getAppClass(app: App): string {
  // MVP: Only plato app exists
  return "app-plato";
}
