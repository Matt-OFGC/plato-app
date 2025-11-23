"use client";

import { useEffect, useState } from "react";
import { getBrandColors } from "@/lib/themes";
import type { Brand } from "@/lib/brands/types";

/**
 * Hook to get brand-aware colors for components
 * Returns CSS variable names that automatically adapt to the current brand
 */
export function useBrandColors() {
  const [brand, setBrand] = useState<Brand | null>(null);

  useEffect(() => {
    // Detect brand from document class
    const detectBrand = () => {
      if (typeof document === "undefined") return null;
      
      if (document.documentElement.classList.contains("brand-plato-bake")) {
        return "plato_bake";
      }
      return "plato";
    };

    setBrand(detectBrand());

    // Watch for brand class changes
    const observer = new MutationObserver(() => {
      setBrand(detectBrand());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Return CSS variable names that will automatically use brand colors
  return {
    primary: "var(--brand-primary)",
    accent: "var(--brand-accent)",
    secondary: "var(--brand-secondary)",
    background: "var(--brand-background)",
    // Utility classes for Tailwind
    primaryClass: "bg-brand-primary text-white",
    accentClass: "bg-brand-accent text-white",
    textPrimaryClass: "text-brand-primary",
    textAccentClass: "text-brand-accent",
    borderPrimaryClass: "border-brand-primary",
    borderAccentClass: "border-brand-accent",
  };
}

