export interface PlatoApp {
  id: string;
  name: string;
  shortName: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  requiredTier: 'starter' | 'professional' | 'team' | 'business';
  color: string;
  isCore: boolean;
}

export const PLATO_APPS: PlatoApp[] = [
  {
    id: 'recipes',
    name: 'Plato Recipes',
    shortName: 'Recipes',
    description: 'Recipe & ingredient management, costing, and scaling',
    route: '/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    requiredTier: 'starter',
    color: 'emerald',
    isCore: true,
  },
  {
    id: 'trade',
    name: 'Plato Trade',
    shortName: 'Trade',
    description: 'Wholesale management, suppliers, and order processing',
    route: '/dashboard/wholesale',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    requiredTier: 'professional',
    color: 'blue',
    isCore: false,
  },
  {
    id: 'insight',
    name: 'Plato Insight',
    shortName: 'Insight',
    description: 'Analytics, reporting, and business intelligence',
    route: '/dashboard/analytics',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    requiredTier: 'professional',
    color: 'purple',
    isCore: false,
  },
  {
    id: 'staff',
    name: 'Plato Staff',
    shortName: 'Staff',
    description: 'Scheduling, timesheets, and leave management',
    route: '/dashboard/staff',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    requiredTier: 'team',
    color: 'orange',
    isCore: false,
  },
];

// Tier hierarchy for comparison
const TIER_HIERARCHY = {
  starter: 0,
  professional: 1,
  team: 2,
  business: 3,
};

export function canAccessApp(appId: string, userTier: string): boolean {
  const app = PLATO_APPS.find(a => a.id === appId);
  if (!app) return false;
  
  const userTierLevel = TIER_HIERARCHY[userTier as keyof typeof TIER_HIERARCHY] ?? 0;
  const requiredTierLevel = TIER_HIERARCHY[app.requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}

export function getAvailableApps(userTier: string): PlatoApp[] {
  return PLATO_APPS.filter(app => canAccessApp(app.id, userTier));
}

export function getAppById(appId: string): PlatoApp | undefined {
  return PLATO_APPS.find(app => app.id === appId);
}

export function getAppByRoute(route: string): PlatoApp | undefined {
  return PLATO_APPS.find(app => route.startsWith(app.route));
}

export function getRequiredTierForApp(appId: string): string {
  const app = getAppById(appId);
  return app?.requiredTier || 'starter';
}
