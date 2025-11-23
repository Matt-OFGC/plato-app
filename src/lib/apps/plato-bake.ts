/**
 * Plato Bake app configuration (bakeries)
 */

import type { AppConfig } from "./types";

export const platoBakeConfig: AppConfig = {
  id: "plato_bake",
  name: "Plato Bake",
  tagline: "Recipe & Production Management for Bakeries",
  logoUrl: "/images/plato-bake-logo.png", // Assuming a specific logo for Plato Bake
  accentColor: "#FFC0CB", // pink
  primaryColor: "#FFB6C1", // light pink
  secondaryColor: "#FFF0F5", // lavender blush
  features: ["recipes", "production", "make"], // Limited features for Plato Bake
};
