/**
 * MVP Configuration
 * Controls which features are visible in MVP mode
 * 
 * In development, MVP mode is automatically disabled to allow testing all features.
 * In production, MVP mode is enabled to show only essential features.
 */

// MVP mode is enabled in production, disabled in development
export const MVP_MODE_ENABLED = process.env.NODE_ENV === 'production';

// Navigation items that should be visible in MVP mode
export const MVP_NAVIGATION_ITEMS = [
  "dashboard",
  "ingredients",
  "recipes",
  "recipe-mixer",
  "production",
  "wholesale",
  "business", // Keep visible per user preference
  "account", // Settings/Account should always be visible
] as const;

// Commands that should be visible in MVP mode (for Command Palette)
export const MVP_COMMANDS = [
  "dashboard",
  "recipes",
  "ingredients",
  "production",
  "wholesale",
  "account",
  "new-recipe",
  "new-ingredient",
] as const;

// Quick actions that should be visible in MVP mode
export const MVP_QUICK_ACTIONS = [
  "production",
  "new-recipe",
  "new-ingredient",
] as const;

/**
 * Check if MVP mode is currently enabled
 */
export function isMVPEnabled(): boolean {
  return MVP_MODE_ENABLED;
}

/**
 * Check if a navigation item should be visible based on MVP mode
 */
export function isNavigationItemVisible(itemValue: string): boolean {
  if (!isMVPEnabled()) {
    // In development, show all items
    return true;
  }
  return MVP_NAVIGATION_ITEMS.includes(itemValue as any);
}

/**
 * Check if a command should be visible based on MVP mode
 */
export function isCommandVisible(commandId: string): boolean {
  if (!isMVPEnabled()) {
    // In development, show all commands
    return true;
  }
  return MVP_COMMANDS.includes(commandId as any);
}

/**
 * Check if a quick action should be visible based on MVP mode
 */
export function isQuickActionVisible(actionId: string): boolean {
  if (!isMVPEnabled()) {
    // In development, show all quick actions
    return true;
  }
  return MVP_QUICK_ACTIONS.includes(actionId as any);
}



