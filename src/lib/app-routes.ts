/**
 * App-aware routing utilities
 * Generates routes that are prefixed with the app name (e.g., /bake/recipes)
 */

import type { App } from "./apps/types";

/**
 * Get the route prefix for an app
 */
export function getAppRoutePrefix(app: App | null): string {
  if (!app || app === "plato") {
    return "/dashboard";
  }
  return `/${app.replace("_", "-")}`; // plato_bake -> /bake
}

/**
 * Convert a dashboard route to an app-aware route
 * Examples:
 * - /dashboard/recipes + plato_bake -> /bake/recipes
 * - /dashboard/recipes + plato -> /dashboard/recipes
 */
export function getAppAwareRoute(path: string, app: App | null): string {
  if (!app || app === "plato") {
    return path;
  }
  
  // Remove /dashboard prefix and add app prefix
  if (path.startsWith("/dashboard")) {
    const suffix = path.replace("/dashboard", "");
    const prefix = getAppRoutePrefix(app);
    return `${prefix}${suffix}`;
  }
  
  // If path doesn't start with /dashboard, return as-is
  return path;
}

/**
 * Detect app from route path
 */
export function getAppFromRoute(path: string): App | null {
  if (path.startsWith("/bake")) {
    return "plato_bake";
  }
  // Return null for /dashboard routes - let query params or defaults handle it
  return null;
}

