/**
 * App registry - central place to manage all apps
 */

import type { App, AppConfig } from "./types";
import { platoConfig } from "./plato";
import { platoBakeConfig } from "./plato-bake";

const appRegistry: Record<App, AppConfig> = {
  plato: platoConfig,
  plato_bake: platoBakeConfig,
};

/**
 * Get app configuration by app ID
 */
export function getAppConfig(app: App): AppConfig {
  return appRegistry[app];
}

/**
 * Get all available apps
 */
export function getAllApps(): AppConfig[] {
  return Object.values(appRegistry);
}

/**
 * Check if an app exists
 */
export function appExists(app: string): app is App {
  return app in appRegistry;
}

/**
 * Get app config by route path
 */
export function getAppByRoute(path: string): AppConfig | null {
  if (path.startsWith("/bake")) {
    return platoBakeConfig;
  }
  return platoConfig; // Default to main Plato
}
