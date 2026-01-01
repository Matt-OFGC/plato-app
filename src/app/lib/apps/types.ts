/**
 * App types and definitions
 */

// App enum from Prisma schema
// MVP: Only plato app exists
export type App = "plato";

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










