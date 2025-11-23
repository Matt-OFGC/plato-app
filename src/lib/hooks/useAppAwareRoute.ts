/**
 * Hook for generating app-aware routes in client components
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getAppFromRoute, getAppAwareRoute } from "@/lib/app-routes";
import { getAppByRoute } from "@/lib/apps/registry";
import type { App } from "@/lib/apps/types";

/**
 * Hook to get the current app and generate app-aware routes
 */
export function useAppAwareRoute() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Detect current app from route or query params
  const currentApp: App = useMemo(() => {
    // First check query params
    const appParam = searchParams?.get("app");
    if (appParam === "plato_bake" || appParam === "plato") {
      return appParam as App;
    }
    
    // Then check route path
    const appFromRoute = getAppFromRoute(pathname);
    if (appFromRoute) {
      return appFromRoute;
    }
    
    // Fall back to detecting from route config
    const appConfig = getAppByRoute(pathname);
    if (appConfig) {
      return appConfig.id;
    }
    
    // Default to plato
    return "plato";
  }, [pathname, searchParams]);
  
  /**
   * Convert a dashboard route to an app-aware route
   */
  const toAppRoute = (path: string): string => {
    return getAppAwareRoute(path, currentApp);
  };
  
  return {
    currentApp,
    toAppRoute,
  };
}

