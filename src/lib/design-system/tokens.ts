/**
 * Plato Design System - Theme Tokens
 * Centralized color schemes, gradients, and styling for all apps
 */

export type AppTheme = 'recipes' | 'staff' | 'wholesale' | 'messaging' | 'platform';

export interface ThemeConfig {
  primary: string;
  primaryHover: string;
  gradient: string;
  gradientHover: string;
  lightBg: string;
  icon: string;
  name: string;
  accentColor: string;
}

export const appThemes: Record<AppTheme, ThemeConfig> = {
  recipes: {
    primary: 'blue-600',
    primaryHover: 'blue-700',
    gradient: 'from-blue-500 to-blue-600',
    gradientHover: 'from-blue-600 to-blue-700',
    lightBg: 'from-blue-50 to-blue-100',
    icon: '🍽️',
    name: 'Recipe App',
    accentColor: '#3B82F6',
  },
  staff: {
    primary: 'purple-600',
    primaryHover: 'purple-700',
    gradient: 'from-purple-500 to-purple-600',
    gradientHover: 'from-purple-600 to-purple-700',
    lightBg: 'from-purple-50 to-purple-100',
    icon: '👥',
    name: 'Staff App',
    accentColor: '#9333EA',
  },
  wholesale: {
    primary: 'green-600',
    primaryHover: 'green-700',
    gradient: 'from-green-500 to-green-600',
    gradientHover: 'from-green-600 to-green-700',
    lightBg: 'from-green-50 to-green-100',
    icon: '📦',
    name: 'Wholesale App',
    accentColor: '#10B981',
  },
  messaging: {
    primary: 'indigo-600',
    primaryHover: 'indigo-700',
    gradient: 'from-indigo-500 to-indigo-600',
    gradientHover: 'from-indigo-600 to-indigo-700',
    lightBg: 'from-indigo-50 to-indigo-100',
    icon: '💬',
    name: 'Team Chat',
    accentColor: '#4F46E5',
  },
  platform: {
    primary: 'gray-600',
    primaryHover: 'gray-700',
    gradient: 'from-gray-500 to-gray-600',
    gradientHover: 'from-gray-600 to-gray-700',
    lightBg: 'from-gray-50 to-gray-100',
    icon: '⚙️',
    name: 'Platform',
    accentColor: '#6B7280',
  },
};

// Shift type colors (for staff scheduler)
export const shiftTypeColors = {
  general: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    text: 'text-blue-50',
    badge: 'bg-blue-100 text-blue-800',
  },
  opening: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-amber-50',
    badge: 'bg-amber-100 text-amber-800',
  },
  closing: {
    bg: 'bg-indigo-500',
    border: 'border-indigo-600',
    text: 'text-indigo-50',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  production: {
    bg: 'bg-green-500',
    border: 'border-green-600',
    text: 'text-green-50',
    badge: 'bg-green-100 text-green-800',
  },
  service: {
    bg: 'bg-purple-500',
    border: 'border-purple-600',
    text: 'text-purple-50',
    badge: 'bg-purple-100 text-purple-800',
  },
};

// Stat card colors (for dashboards)
export const statCardColors = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  amber: 'from-amber-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  indigo: 'from-indigo-500 to-indigo-600',
};

// Utility functions
export function getTheme(app: AppTheme): ThemeConfig {
  return appThemes[app];
}

export function getGradientClasses(app: AppTheme): string {
  return `bg-gradient-to-r ${appThemes[app].gradient}`;
}

export function getGradientHoverClasses(app: AppTheme): string {
  return `hover:from-${appThemes[app].primaryHover} hover:to-${appThemes[app].primaryHover}`;
}

export function getPrimaryButtonClasses(app: AppTheme): string {
  const theme = appThemes[app];
  return `bg-gradient-to-r ${theme.gradient} hover:${theme.gradientHover} text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all`;
}

export function getCardHeaderClasses(app: AppTheme): string {
  const theme = appThemes[app];
  return `bg-gradient-to-r ${theme.gradient} p-6 text-white`;
}

export function getLightBgClasses(app: AppTheme): string {
  const theme = appThemes[app];
  return `bg-gradient-to-br ${theme.lightBg}`;
}

// Detect current app from pathname
export function detectAppFromPath(pathname: string): AppTheme {
  if (pathname.includes('/recipes') || pathname.includes('/ingredients')) return 'recipes';
  if (pathname.includes('/staff')) return 'staff';
  if (pathname.includes('/wholesale')) return 'wholesale';
  if (pathname.includes('/messages')) return 'messaging';
  return 'platform';
}
