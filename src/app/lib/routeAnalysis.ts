/**
 * Route analysis utility for debugging routing issues
 */

export interface RouteInfo {
  path: string;
  file: string;
  type: 'page' | 'layout' | 'component' | 'api';
  exists: boolean;
  imports: string[];
  issues: string[];
}

export interface ComponentInfo {
  name: string;
  expectedPath: string;
  actualPath: string | null;
  exists: boolean;
  issues: string[];
}

/**
 * Get the complete route tree for the application
 */
export function getRouteTree(): RouteInfo[] {
  const routes: RouteInfo[] = [
    // Root routes
    {
      path: '/',
      file: 'app/page.tsx',
      type: 'page',
      exists: true,
      imports: ['@/components/Providers'],
      issues: []
    },
    {
      path: '/layout',
      file: 'app/layout.tsx',
      type: 'layout',
      exists: true,
      imports: ['@/components/Providers', '@/components/DebugBadge'],
      issues: []
    },

    // Dashboard routes
    {
      path: '/dashboard',
      file: 'app/dashboard/page.tsx',
      type: 'page',
      exists: true,
      imports: [
        '@/components/DashboardWithOnboarding',
        '@/components/OperationalDashboard'
      ],
      issues: []
    },
    {
      path: '/dashboard/layout',
      file: 'app/dashboard/layout.tsx',
      type: 'layout',
      exists: true,
      imports: [
        '@/components/SidebarImproved',
        '@/components/FloatingBackButton',
        '@/components/KeyboardShortcutsProvider',
        '@/components/ErrorBoundary',
        '@/components/DashboardNavWrapper'
      ],
      issues: [
        'CRITICAL: SidebarImproved component missing from src/app/components/',
        'CRITICAL: DashboardNavWrapper component missing from src/app/components/',
        'CRITICAL: FloatingBackButton component missing from src/app/components/',
        'CRITICAL: KeyboardShortcutsProvider component missing from src/app/components/',
        'CRITICAL: ErrorBoundary component missing from src/app/components/'
      ]
    },

    // Dashboard sub-routes
    {
      path: '/dashboard/recipes',
      file: 'app/dashboard/recipes/page.tsx',
      type: 'page',
      exists: true,
      imports: [
        '@/components/RecipeCategoryFilter',
        '@/components/SearchBar',
        '@/components/SmartImporter',
        '@/components/RecipesView'
      ],
      issues: []
    },
    {
      path: '/dashboard/business',
      file: 'app/dashboard/business/page.tsx',
      type: 'page',
      exists: true,
      imports: [],
      issues: []
    },
    {
      path: '/dashboard/account',
      file: 'app/dashboard/account/page.tsx',
      type: 'page',
      exists: true,
      imports: [
        '@/components/CategoryManagerEnhanced',
        '@/components/ShelfLifeManagerEnhanced',
        '@/components/StorageManagerEnhanced',
        '@/components/SupplierManager',
        '@/components/SubscriptionStatus',
        '@/components/SettingsTabs',
        '@/components/TimerSettings',
        '@/app/components/CurrencySettings',
        '@/app/components/FoodCostSettings'
      ],
      issues: []
    },
    {
      path: '/dashboard/ingredients',
      file: 'app/dashboard/ingredients/page.tsx',
      type: 'page',
      exists: true,
      imports: [],
      issues: []
    },
    {
      path: '/dashboard/team',
      file: 'app/dashboard/team/page.tsx',
      type: 'page',
      exists: true,
      imports: [],
      issues: []
    },

    // Debug route
    {
      path: '/__debug',
      file: 'app/__debug/page.tsx',
      type: 'page',
      exists: true,
      imports: ['@/lib/buildInfo'],
      issues: []
    }
  ];

  return routes;
}

/**
 * Get component analysis for debugging import issues
 */
export function getComponentAnalysis(): ComponentInfo[] {
  const components: ComponentInfo[] = [
    {
      name: 'SidebarImproved',
      expectedPath: 'src/app/components/SidebarImproved.tsx',
      actualPath: 'src/components/SidebarImproved.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    },
    {
      name: 'DashboardNavWrapper',
      expectedPath: 'src/app/components/DashboardNavWrapper.tsx',
      actualPath: 'src/components/DashboardNavWrapper.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    },
    {
      name: 'Providers',
      expectedPath: 'src/app/components/Providers.tsx',
      actualPath: 'src/components/Providers.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    },
    {
      name: 'ErrorBoundary',
      expectedPath: 'src/app/components/ErrorBoundary.tsx',
      actualPath: 'src/components/ErrorBoundary.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    },
    {
      name: 'FloatingBackButton',
      expectedPath: 'src/app/components/FloatingBackButton.tsx',
      actualPath: 'src/components/FloatingBackButton.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    },
    {
      name: 'KeyboardShortcutsProvider',
      expectedPath: 'src/app/components/KeyboardShortcutsProvider.tsx',
      actualPath: 'src/components/KeyboardShortcutsProvider.tsx',
      exists: true,
      issues: ['Component exists in src/components/ but imported from @/components/ (which resolves to src/app/components/)']
    }
  ];

  return components;
}

/**
 * Get critical issues that need immediate attention
 */
export function getCriticalIssues(): string[] {
  return [
    'CRITICAL: Component import path mismatch - Components exist in src/components/ but are imported from @/components/ which resolves to src/app/components/',
    'CRITICAL: Dashboard layout will fail to render due to missing components',
    'CRITICAL: All dashboard pages will be affected by missing layout components',
    'SOLUTION: Either move components from src/components/ to src/app/components/ OR update imports to use @/src/components/'
  ];
}

/**
 * Get recommended fixes
 */
export function getRecommendedFixes(): string[] {
  return [
    'Option 1: Move all components from src/components/ to src/app/components/',
    'Option 2: Update all imports from @/components/ to @/src/components/',
    'Option 3: Create symlinks from src/app/components/ to src/components/',
    'RECOMMENDED: Option 1 - Move components to maintain Next.js 13+ app directory structure'
  ];
}
