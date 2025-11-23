/**
 * Brand configuration types
 */

export type Brand = "plato" | "plato_bake";

export type FeatureModuleName = "recipes" | "production" | "make" | "teams" | "safety";

export interface BrandConfig {
  id: Brand;
  name: string;
  tagline: string;
  colors: {
    primary: string;
    accent: string;
    secondary: string;
    background: string;
  };
  logo?: string;
  favicon?: string;
  routes: {
    landing: string;
    register: string;
    pricing: string;
  };
  features: FeatureModuleName[];
  pricing: {
    monthly: number;
    stripePriceId?: string;
    stripeProductId?: string;
  };
}

