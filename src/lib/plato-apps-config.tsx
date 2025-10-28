export interface PlatoApp {
  id: string;
  name: string;
  shortName: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const PLATO_APPS: PlatoApp[] = [
  {
    id: 'recipes',
    name: 'Plato Recipes',
    shortName: 'Recipes',
    description: 'Recipe & ingredient management, costing, and scaling',
    route: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'teams',
    name: 'Plato Teams',
    shortName: 'Teams',
    description: 'Team management, staff scheduling, and user administration',
    route: '/dashboard/team',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  {
    id: 'production',
    name: 'Plato Production',
    shortName: 'Production',
    description: 'Production planning, wholesale, and analytics',
    route: '/dashboard/production',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
];

export function getAppById(appId: string): PlatoApp | undefined {
  return PLATO_APPS.find(app => app.id === appId);
}

export function getAppByRoute(route: string): PlatoApp | undefined {
  return PLATO_APPS.find(app => route.startsWith(app.route));
}

export function getAllApps(): PlatoApp[] {
  return PLATO_APPS;
}
