import React from 'react';

export interface PlatoApp {
  id: string;
  name: string;
  shortName: string;
  description: string;
  route: string;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
  requiredTier?: 'professional' | 'team' | 'business';
}

export const PLATO_APPS: PlatoApp[] = [
  {
    id: 'recipes',
    name: 'Plato Recipes',
    shortName: 'Recipes',
    description: 'Recipe management with automatic cost calculation and unit conversion',
    route: '/dashboard',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    requiredTier: 'professional'
  },
  {
    id: 'teams',
    name: 'Plato Teams',
    shortName: 'Teams',
    description: 'Team management, staff scheduling, and payroll integration',
    route: '/dashboard/team',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    requiredTier: 'team'
  },
  {
    id: 'production',
    name: 'Plato Production',
    shortName: 'Production',
    description: 'Production planning, wholesale management, and analytics',
    route: '/dashboard/production',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    requiredTier: 'business'
  }
];

export function getAppById(id: string): PlatoApp | undefined {
  return PLATO_APPS.find(app => app.id === id);
}

export function getAppByRoute(route: string): PlatoApp | undefined {
  // Sort apps by route length (longest first) to match most specific routes first
  const sortedApps = [...PLATO_APPS].sort((a, b) => b.route.length - a.route.length);
  
  return sortedApps.find(app => {
    // Handle exact matches
    if (route === app.route) return true;
    
    // Handle sub-routes (e.g., /dashboard/production/view matches production app)
    // Check if route starts with app.route followed by / or is the same
    if (route.startsWith(app.route + '/')) return true;
    
    // Special case for dashboard root - only match if it's exactly /dashboard
    if (app.id === 'recipes' && route === '/dashboard') return true;
    
    // Special handling for teams app - match /dashboard/team and all sub-routes
    if (app.id === 'teams' && (route.startsWith('/dashboard/team') || route.startsWith('/dashboard/scheduling') || route.startsWith('/dashboard/training'))) {
      return true;
    }
    
    return false;
  });
}
