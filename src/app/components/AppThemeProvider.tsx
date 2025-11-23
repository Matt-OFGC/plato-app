"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getAppByRoute, getAppConfig, appExists } from "@/lib/apps/registry";
import { applyAppTheme } from "@/lib/themes";
import type { App } from "@/lib/apps/types";

/**
 * Inner component that uses useSearchParams (must be wrapped in Suspense)
 */
function AppThemeProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // First check if app is specified in query params (e.g., /dashboard?app=plato_bake)
    const appParam = searchParams?.get("app");
    let appId: App = "plato";
    
    if (appParam && appExists(appParam)) {
      appId = appParam;
    } else {
      // Fall back to detecting app from route
      const appConfig = getAppByRoute(pathname);
      appId = appConfig?.id || "plato";
    }
    
    // Apply app theme class
    applyAppTheme(appId);
    
    // Also set CSS variables directly on html element as fallback
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      const appConfig = getAppConfig(appId);
      
      if (appId === "plato_bake") {
        html.style.setProperty("--brand-primary", appConfig.primaryColor, "important");
        html.style.setProperty("--brand-accent", appConfig.accentColor, "important");
        html.style.setProperty("--brand-secondary", appConfig.secondaryColor, "important");
        html.style.setProperty("--brand-background", "#ffffff", "important");
      } else {
        html.style.setProperty("--brand-primary", "#059669", "important");
        html.style.setProperty("--brand-accent", "#10b981", "important");
        html.style.setProperty("--brand-secondary", "#f0fdf4", "important");
        html.style.setProperty("--brand-background", "#ffffff", "important");
      }
    }
  }, [pathname, searchParams]);

  return <>{children}</>;
}

/**
 * App Theme Provider - applies app-specific CSS classes based on route and query params
 * Wrapped in Suspense for useSearchParams compatibility
 */
export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <AppThemeProviderInner>{children}</AppThemeProviderInner>
    </Suspense>
  );
}

