/**
 * App types and definitions
 */

// App enum from Prisma schema
export type App = "plato" | "plato_bake";

/**
 * App configuration interface
 */
export interface AppConfig {
  id: App;
  name: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  secondaryColor: string;
  features: string[];
  route: string;
}






