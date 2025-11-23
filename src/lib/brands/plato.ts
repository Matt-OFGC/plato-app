/**
 * Main Plato brand configuration (cafes & restaurants)
 * This represents the current app behavior
 */

import type { BrandConfig } from "./types";

export const platoConfig: BrandConfig = {
  id: "plato",
  name: "Plato",
  tagline: "For cafes and restaurants",
  colors: {
    primary: "#059669", // emerald-600
    accent: "#10b981", // emerald-500
    secondary: "#f0fdf4", // emerald-50
    background: "#ffffff",
  },
  routes: {
    landing: "/",
    register: "/register",
    pricing: "/pricing",
  },
  features: ["recipes", "production", "make", "teams", "safety"],
  pricing: {
    monthly: 30, // Professional tier
    stripePriceId: process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID,
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID,
  },
};

