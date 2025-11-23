/**
 * Server-side utilities for detecting app context
 */

import { headers } from "next/headers";
import { getAppFromRoute } from "./app-routes";
import type { App } from "./apps/types";

/**
 * Detect app from request headers (referer or pathname)
 * Returns the app ID or null if cannot be determined
 */
export async function getAppFromHeaders(): Promise<App | null> {
  const headersList = await headers();
  const referer = headersList.get("referer");
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path");
  
  // First try to get from custom header if available
  if (pathname) {
    const app = getAppFromRoute(pathname);
    if (app) return app;
  }
  
  // Fall back to referer URL
  if (referer) {
    try {
      const url = new URL(referer);
      const app = getAppFromRoute(url.pathname);
      if (app) return app;
    } catch {
      // Invalid URL, ignore
    }
  }
  
  return null;
}

/**
 * Get app-aware route for server actions
 * Falls back to /dashboard if app cannot be determined
 */
export async function getAppAwareRouteForServer(path: string): Promise<string> {
  const app = await getAppFromHeaders();
  const { getAppAwareRoute } = await import("./app-routes");
  return getAppAwareRoute(path, app);
}

