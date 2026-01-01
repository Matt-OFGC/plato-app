/**
 * App registry - manages app configurations and routing
 */

import type { App, AppConfig } from "./types";
import { getAppFromRoute } from "../app-routes";

/**
 * App configurations
 * MVP: Only Plato app exists - plato_bake removed
 */
const APP_CONFIGS: Record<App, AppConfig> = {
  plato: {
    id: "plato",
    name: "Plato",
    tagline: "Recipe & Cost Management",
    primaryColor: "#059669",
    accentColor: "#10b981",
    secondaryColor: "#f0fdf4",
    features: ["recipes", "production", "teams"], // MVP features only
    route: "/dashboard",
  },
};

/**
 * Get app configuration by app ID
 * MVP: Always return plato config
 */
export function getAppConfig(app: App): AppConfig {
  // MVP: Always return plato config, ignore plato_bake
  return APP_CONFIGS.plato;
}

/**
 * Check if an app exists
 * MVP: Only plato exists
 */
export function appExists(appId: string): appId is App {
  return appId === "plato";
}

/**
 * Get all available apps
 * MVP: Only return plato app
 */
export function getAllApps(): AppConfig[] {
  // MVP: Only return plato app, hide plato_bake
  return [APP_CONFIGS.plato];
}

/**
 * Get app by route path
 * This is a legacy function for compatibility - use getAppFromRoute from app-routes instead
 * MVP: Always returns plato config
 */
export function getAppByRoute(route: string): AppConfig | null {
  // MVP: Always return plato config
  return getAppConfig("plato");
}










