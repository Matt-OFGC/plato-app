"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBrandByRoute } from "@/lib/brands/registry";
import { applyBrandTheme } from "@/lib/themes";

/**
 * Brand Theme Provider - applies brand-specific CSS classes based on route
 */
export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Detect brand from route
    const brandConfig = getBrandByRoute(pathname);
    const brandId = brandConfig?.id || "plato";
    
    // Apply brand theme class
    applyBrandTheme(brandId);
    
    // Also set CSS variables directly on html element as fallback
    if (typeof document !== "undefined") {
      const html = document.documentElement;
      
      if (brandId === "plato_bake") {
        html.style.setProperty("--brand-primary", "#FFB6C1", "important");
        html.style.setProperty("--brand-accent", "#FFC0CB", "important");
        html.style.setProperty("--brand-secondary", "#FFF0F5", "important");
        html.style.setProperty("--brand-background", "#ffffff", "important");
      } else {
        html.style.setProperty("--brand-primary", "#059669", "important");
        html.style.setProperty("--brand-accent", "#10b981", "important");
        html.style.setProperty("--brand-secondary", "#f0fdf4", "important");
        html.style.setProperty("--brand-background", "#ffffff", "important");
      }
    }
  }, [pathname]);

  return <>{children}</>;
}

