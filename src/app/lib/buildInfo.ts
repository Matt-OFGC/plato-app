/**
 * Build information utility for debugging and version tracking
 */

// Get build time from environment or current time
export const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();

// Get git SHA from environment or generate a placeholder
export const GIT_SHA = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 
                      process.env.GIT_SHA?.slice(0, 7) || 
                      'dev-build';

// Get app version from package.json or use default
export const APP_VERSION = process.env.npm_package_version || '0.1.0';

// Environment info
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const VERCEL_ENV = process.env.VERCEL_ENV || 'development';

// Build info object
export const BUILD_INFO = {
  buildTime: BUILD_TIME,
  gitSha: GIT_SHA,
  appVersion: APP_VERSION,
  nodeEnv: NODE_ENV,
  vercelEnv: VERCEL_ENV,
  timestamp: Date.now(),
} as const;

// Function to get formatted build info string
export function getBuildInfoString(): string {
  return `${APP_VERSION} • ${GIT_SHA} • ${new Date(BUILD_TIME).toLocaleString()}`;
}

// Function to get build info for debugging
export function getDebugInfo() {
  return {
    ...BUILD_INFO,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    timestamp: new Date().toISOString(),
  };
}
