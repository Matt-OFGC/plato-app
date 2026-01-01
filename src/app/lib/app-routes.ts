/**
 * App-aware routing utilities
 * Generates routes that are prefixed with the app name (e.g., /bake/recipes)
 */

import type { App } from "./apps/types";

/**
 * Get the route prefix for an app
 */
export function getAppRoutePrefix(app: App | null): string {
  // MVP: Only plato app exists - always return /dashboard
  return "/dashboard";
}

/**
 * Convert a dashboard route to an app-aware route
 * MVP: Only plato app exists - always return /dashboard routes
 */
export function getAppAwareRoute(path: string, app: App | null): string {
  // MVP: Only plato app - ensure path starts with /dashboard
  if (path.startsWith("/dashboard")) {
    return path;
  }
  // If path doesn't start with /dashboard, add it
  if (path.startsWith("/")) {
    return `/dashboard${path}`;
  }
  return `/dashboard/${path}`;
}

/**
 * Detect app from route path
 * MVP: Always return null (force plato app)
 */
export function getAppFromRoute(path: string): App | null {
  // MVP: Always return null to force plato app
  // No app detection needed - only one app exists
  return null;
}

/**
 * Extract the base route from an app-aware route
 * Examples:
 * - /bake/recipes -> /recipes
 * - /dashboard/recipes -> /recipes
 */
export function getBaseRoute(path: string): string {
  if (path.startsWith("/bake/")) {
    return path.replace("/bake", "");
  }
  if (path.startsWith("/dashboard/")) {
    return path.replace("/dashboard", "");
  }
  return path;
}

