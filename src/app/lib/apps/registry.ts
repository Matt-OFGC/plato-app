/**
 * App registry - manages app configurations and routing
 */

import type { App, AppConfig } from "./types";
import { getAppFromRoute } from "../app-routes";

/**
 * App configurations
 */
const APP_CONFIGS: Record<App, AppConfig> = {
  plato: {
    id: "plato",
    name: "Plato",
    tagline: "Recipe & Cost Management",
    primaryColor: "#059669",
    accentColor: "#10b981",
    secondaryColor: "#f0fdf4",
    features: ["recipes", "production", "teams", "safety"],
    route: "/dashboard",
  },
  plato_bake: {
    id: "plato_bake",
    name: "Plato Bake",
    tagline: "Bakery Operations Management",
    primaryColor: "#d97706",
    accentColor: "#f59e0b",
    secondaryColor: "#fef3c7",
    features: ["recipes", "production"],
    route: "/bake",
  },
};

/**
 * Get app configuration by app ID
 */
export function getAppConfig(app: App): AppConfig {
  return APP_CONFIGS[app] || APP_CONFIGS.plato;
}

/**
 * Check if an app exists
 */
export function appExists(appId: string): appId is App {
  return appId === "plato" || appId === "plato_bake";
}

/**
 * Get all available apps
 */
export function getAllApps(): AppConfig[] {
  return Object.values(APP_CONFIGS);
}

/**
 * Get app by route path
 * This is a legacy function for compatibility - use getAppFromRoute from app-routes instead
 */
export function getAppByRoute(route: string): AppConfig | null {
  const app = getAppFromRoute(route);
  if (app) {
    return getAppConfig(app);
  }
  // Fallback: check if route starts with known app routes
  if (route.startsWith("/bake")) {
    return getAppConfig("plato_bake");
  }
  if (route.startsWith("/dashboard")) {
    return getAppConfig("plato");
  }
  return null;
}

