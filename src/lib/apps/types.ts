/**
 * App configuration types
 */

export type App = "plato" | "plato_bake";

export interface AppConfig {
  id: App;
  name: string;
  tagline: string;
  logoUrl: string;
  accentColor: string;
  primaryColor: string;
  secondaryColor: string;
  features: Array<"recipes" | "production" | "make" | "teams" | "safety">;
  // Add other app-specific configurations here
}
