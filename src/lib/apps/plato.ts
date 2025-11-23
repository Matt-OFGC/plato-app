/**
 * Main Plato app configuration (cafes & restaurants)
 */

import type { AppConfig } from "./types";

export const platoConfig: AppConfig = {
  id: "plato",
  name: "Plato",
  tagline: "The Operating System for Hospitality",
  logoUrl: "/images/plato-logo.png",
  accentColor: "#10b981", // emerald-500
  primaryColor: "#059669", // emerald-600
  secondaryColor: "#f0fdf4", // emerald-50
  features: ["recipes", "production", "make", "teams", "safety"],
};
