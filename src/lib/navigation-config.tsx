export interface NavigationItem {
  value: string;
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  appContext: string; // Which Plato app this belongs to
  requiredTier?: 'starter' | 'professional' | 'team' | 'business';
}

export const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  // Plato Recipes App (Core)
  { 
    value: "dashboard",
    href: "/dashboard", 
    label: "Dashboard", 
    shortLabel: "Home",
    appContext: "recipes",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    value: "ingredients",
    href: "/dashboard/ingredients", 
    label: "Ingredients", 
    shortLabel: "Ingredients",
    appContext: "recipes",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    value: "recipes",
    href: "/dashboard/recipes", 
    label: "Recipes", 
    shortLabel: "Recipes",
    appContext: "recipes",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    value: "recipe-mixer",
    href: "/dashboard/recipe-mixer", 
    label: "Recipe Mixer", 
    shortLabel: "Mixer",
    appContext: "recipes",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  },
  { 
    value: "production",
    href: "/dashboard/production", 
    label: "Production", 
    shortLabel: "Production",
    appContext: "recipes",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },

  // Plato Trade App (Professional+)
  { 
    value: "wholesale",
    href: "/dashboard/wholesale", 
    label: "Wholesale", 
    shortLabel: "Wholesale",
    appContext: "trade",
    requiredTier: "professional",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },

  // Plato Insight App (Professional+)
  { 
    value: "analytics",
    href: "/dashboard/analytics", 
    label: "Analytics", 
    shortLabel: "Analytics",
    appContext: "insight",
    requiredTier: "professional",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },

  // Plato Staff App (Team+)
  { 
    value: "staff",
    href: "/dashboard/staff", 
    label: "Staff", 
    shortLabel: "Staff",
    appContext: "staff",
    requiredTier: "team",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    )
  },

  // Plato Make App - Label Generator
  {
    value: "sales-labels",
    href: "/dashboard/make/labels/sales",
    label: "Sales Labels",
    shortLabel: "Sales Labels",
    appContext: "make",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  },
  {
    value: "allergen-sheets",
    href: "/dashboard/make/labels/allergen-sheets",
    label: "Allergen Sheets",
    shortLabel: "Allergen Sheets",
    appContext: "make",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },

  // System/Account Management (Available to all)
  {
    value: "account",
    href: "/dashboard/account",
    label: "Settings",
    shortLabel: "Settings",
    appContext: "system",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    value: "business",
    href: "/dashboard/business", 
    label: "Business Profile", 
    shortLabel: "Business",
    appContext: "system",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  { 
    value: "team",
    href: "/dashboard/team", 
    label: "Team", 
    shortLabel: "Team",
    appContext: "system",
    requiredTier: "starter",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
];

// Default navigation items for new users
export const DEFAULT_NAVIGATION_ITEMS = ["dashboard", "ingredients", "recipes", "recipe-mixer", "production", "analytics"];

// Helper function to get navigation items by their values
export const getNavigationItemsByValues = (values: string[]): NavigationItem[] => {
  return ALL_NAVIGATION_ITEMS.filter(item => values.includes(item.value));
};

// Helper function to get navigation items by app context
export const getNavigationItemsByApp = (appContext: string): NavigationItem[] => {
  return ALL_NAVIGATION_ITEMS.filter(item => item.appContext === appContext);
};

// Helper function to filter navigation items by user tier
export const getNavigationItemsByTier = (userTier: string): NavigationItem[] => {
  const tierHierarchy = {
    starter: 0,
    professional: 1,
    team: 2,
    business: 3,
  };
  
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] ?? 0;
  
  return ALL_NAVIGATION_ITEMS.filter(item => {
    if (!item.requiredTier) return true;
    const requiredTierLevel = tierHierarchy[item.requiredTier];
    return userTierLevel >= requiredTierLevel;
  });
};

// Helper function to get navigation items for active app and user tier
export const getFilteredNavigationItems = (activeApp: string | null, userTier: string): NavigationItem[] => {
  const tierFiltered = getNavigationItemsByTier(userTier);
  
  if (!activeApp) {
    return tierFiltered;
  }
  
  // Show items for the active app plus system items
  return tierFiltered.filter(item => 
    item.appContext === activeApp || item.appContext === 'system'
  );
};
