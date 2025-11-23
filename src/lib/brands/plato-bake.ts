/**
 * Plato Bake brand configuration (bakeries)
 * Focused feature set: recipes, production, make
 */

import type { BrandConfig } from "./types";

export const platoBakeConfig: BrandConfig = {
  id: "plato_bake",
  name: "Plato Bake",
  tagline: "For bakeries",
  colors: {
    primary: "#FFB6C1", // light pink
    accent: "#FFC0CB", // pink
    secondary: "#FFF0F5", // lavender blush
    background: "#ffffff",
  },
  routes: {
    landing: "/bake",
    register: "/bake/register",
    pricing: "/bake/pricing",
  },
  features: ["recipes", "production", "make"], // Limited feature set
  pricing: {
    monthly: 19.99,
    stripePriceId: process.env.STRIPE_PLATO_BAKE_MONTHLY_PRICE_ID,
    stripeProductId: process.env.STRIPE_PLATO_BAKE_PRODUCT_ID,
  },
};

