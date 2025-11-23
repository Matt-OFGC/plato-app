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
  
  // Normalize app string for comparison (handle both underscore and hyphen variants)
  const appStr = String(app).trim();
  const normalizedApp = appStr.toLowerCase();
  
  // Map app IDs to route prefixes - check specific apps first
  // Handle both "plato_bake" and "plato-bake" variants
  if (normalizedApp === "plato_bake" || normalizedApp === "plato-bake" || appStr === "plato_bake" || appStr === "plato-bake") {
    return "/bake";
  }
  
  // Additional check: if app string contains "plato" and "bake", return /bake
  if (normalizedApp.includes("plato") && normalizedApp.includes("bake")) {
    return "/bake";
  }
  
  // Fallback: convert underscore to hyphen for future apps
  // But only if it's not one of the known apps above
  if (app && String(app).includes("_")) {
    const converted = String(app).replace(/_/g, "-");
    // Triple-check: if the converted value contains plato-bake, return /bake
    if (converted.toLowerCase().includes("plato-bake")) {
      return "/bake";
    }
    return `/${converted}`;
  }
  
  // If app is null or doesn't match, return /dashboard as default
  return "/dashboard";
}

/**
 * Convert a dashboard route to an app-aware route
 * Examples:
 * - /dashboard/recipes + plato_bake -> /bake/recipes
 * - /dashboard/recipes + plato -> /dashboard/recipes
 * - /recipes + plato_bake -> /bake/recipes
 */
export function getAppAwareRoute(path: string, app: App | null): string {
  if (!app || app === "plato") {
    // For plato app, ensure path starts with /dashboard
    if (path.startsWith("/dashboard")) {
      return path;
    }
    // If path doesn't start with /dashboard, add it
    if (path.startsWith("/")) {
      return `/dashboard${path}`;
    }
    return `/dashboard/${path}`;
  }
  
  const appPrefix = getAppRoutePrefix(app);
  
  // Safety check: if somehow we got /plato-bake, convert it to /bake
  const normalizedPrefix = appPrefix === "/plato-bake" ? "/bake" : appPrefix;
  
  // Remove /dashboard prefix if present
  if (path.startsWith("/dashboard")) {
    const suffix = path.replace("/dashboard", "");
    // Handle edge case: /dashboard becomes empty string, should be app root
    // /dashboard/ becomes /, which we want to keep as /
    const finalPath = suffix === "" ? "" : suffix;
    const result = `${normalizedPrefix}${finalPath}`;
    // Normalize trailing slash for root paths
    const normalizedResult = result === `${normalizedPrefix}/` ? normalizedPrefix : result;
    // Final safety check: if result contains /plato-bake, replace with /bake
    return normalizedResult.replace("/plato-bake", "/bake");
  }
  
  // If path already starts with app prefix, return as-is (but normalize if needed)
  if (path.startsWith(normalizedPrefix)) {
    return path.replace("/plato-bake", "/bake");
  }
  
  // If path already starts with /plato-bake, convert to /bake
  if (path.startsWith("/plato-bake")) {
    return path.replace("/plato-bake", "/bake");
  }
  
  // Otherwise, add app prefix
  if (path.startsWith("/")) {
    const result = `${normalizedPrefix}${path}`;
    return result.replace("/plato-bake", "/bake");
  }
  
  const result = `${normalizedPrefix}/${path}`;
  return result.replace("/plato-bake", "/bake");
}

/**
 * Detect app from route path
 */
export function getAppFromRoute(path: string): App | null {
  // Normalize path - remove trailing slashes for consistent matching
  const normalizedPath = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  
  // Check for bake routes - exact match or starts with /bake/
  if (normalizedPath === "/bake" || normalizedPath.startsWith("/bake/")) {
    return "plato_bake";
  }
  
  // Return null for /dashboard routes - let query params or defaults handle it
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

