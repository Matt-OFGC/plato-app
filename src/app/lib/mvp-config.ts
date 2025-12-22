/**
 * MVP Configuration - Simplified navigation visibility
 * All MVP features are always visible
 */

/**
 * Check if a navigation item should be visible
 * For MVP, all items are visible
 */
export function isNavigationItemVisible(item: string): boolean {
  // All MVP features are visible
  const mvpItems = [
    "dashboard",
    "ingredients",
    "recipes",
    "recipe-mixer",
    "production",
    "wholesale",
    "team",
    "account",
  ];
  
  return mvpItems.includes(item);
}

/**
 * Check if a command should be visible
 * For MVP, all commands are visible
 */
export function isCommandVisible(command: string): boolean {
  // All MVP commands are visible
  return true;
}

