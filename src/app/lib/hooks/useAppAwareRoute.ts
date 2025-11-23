"use client";

import { usePathname } from "next/navigation";
import { getAppAwareRoute, getAppFromRoute } from "@/lib/app-routes";
import type { App } from "@/lib/apps/types";

/**
 * Hook for generating app-aware routes in client components
 * Automatically converts /dashboard/* routes to app-specific routes (e.g., /bake/*)
 */
export function useAppAwareRoute() {
  const pathname = usePathname();
  
  // Detect app from current pathname
  // Normalize pathname to handle edge cases
  const normalizedPathname = pathname || "";
  const detectedApp = getAppFromRoute(normalizedPathname);

  /**
   * Convert a dashboard route to an app-aware route
   * @param path - The route path (e.g., "/dashboard/recipes" or "/recipes")
   * @returns The app-aware route (e.g., "/bake/recipes" when in plato_bake app)
   */
  const toAppRoute = (path: string): string => {
    if (!path) return path;
    
    // Use detected app from pathname
    const app: App | null = detectedApp || null;
    const route = getAppAwareRoute(path, app);
    return route;
  };

  return { toAppRoute, activeApp: detectedApp };
}

