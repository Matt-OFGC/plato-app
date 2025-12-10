"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFilteredNavigationItems } from "@/lib/navigation-config";
import { useAppContext } from "./AppContextProvider";
import { usePageActions } from "./PageActionContext";
import { FloatingFilter } from "./FloatingFilter";
import { SmartImportButton } from "./SmartImportButton";
import { useRecipeView } from "./RecipeViewContext";
import { ScrollHideNav } from "./ScrollHideNav";

interface FloatingNavigationProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

// Tab configurations based on page context
const getTabsForPath = (pathname: string, activeApp: string | null): { tabs: string[]; links?: string[]; isRecipePage?: boolean } => {
  // Recipes section - Recipes, Ingredients, Recipe Mixer
  if (pathname.startsWith('/dashboard/recipes') || pathname.startsWith('/dashboard/ingredients') || pathname.startsWith('/dashboard/recipe-mixer')) {
    // Individual recipe page (has ID in path) - return empty tabs, we'll show view switchers instead
    if (pathname.match(/^\/dashboard\/recipes\/[^/]+$/)) {
      return { tabs: [], isRecipePage: true };
    }
    // Recipes list pages - separate tabs for Recipes, Ingredients, and Recipe Mixer
    return { 
      tabs: ['Recipes', 'Ingredients', 'Recipe Mixer'],
      links: ['/dashboard/recipes', '/dashboard/ingredients', '/dashboard/recipe-mixer']
    };
  }

  // Teams section - Team, Scheduling, Training
  if (pathname.startsWith('/dashboard/team') || pathname.startsWith('/dashboard/scheduling') || pathname.startsWith('/dashboard/training')) {
    return { 
      tabs: ['Team', 'Scheduling', 'Training'],
      links: ['/dashboard/team', '/dashboard/scheduling', '/dashboard/training']
    };
  }
  
  // Legacy staff routes - redirect to team
  if (pathname.startsWith('/dashboard/staff')) {
    return { 
      tabs: ['Team', 'Scheduling', 'Training'],
      links: ['/dashboard/team', '/dashboard/scheduling', '/dashboard/training']
    };
  }

  // Production section - show tabs for easy navigation between production pages
  if (pathname.startsWith('/dashboard/production') || pathname.startsWith('/dashboard/wholesale') || pathname.startsWith('/dashboard/analytics')) {
    // Wholesale-specific pages - show detailed tabs
    if (pathname.startsWith('/dashboard/wholesale')) {
      // Orders page
      if (pathname.startsWith('/dashboard/wholesale/orders')) {
        return { 
          tabs: ['Production', 'Wholesale', 'Orders', 'Calendar', 'Invoices', 'Customers', 'Analytics'],
          links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/wholesale/orders', '/dashboard/wholesale/calendar', '/dashboard/wholesale/invoices', '/dashboard/wholesale', '/dashboard/analytics']
        };
      }
      // Calendar page
      if (pathname.startsWith('/dashboard/wholesale/calendar')) {
        return { 
          tabs: ['Production', 'Wholesale', 'Orders', 'Calendar', 'Invoices', 'Customers', 'Analytics'],
          links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/wholesale/orders', '/dashboard/wholesale/calendar', '/dashboard/wholesale/invoices', '/dashboard/wholesale', '/dashboard/analytics']
        };
      }
      // Invoices page
      if (pathname.startsWith('/dashboard/wholesale/invoices')) {
        return { 
          tabs: ['Production', 'Wholesale', 'Orders', 'Calendar', 'Invoices', 'Customers', 'Analytics'],
          links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/wholesale/orders', '/dashboard/wholesale/calendar', '/dashboard/wholesale/invoices', '/dashboard/wholesale', '/dashboard/analytics']
        };
      }
      // Main wholesale page (shows customers by default)
      if (pathname === '/dashboard/wholesale' || pathname === '/dashboard/wholesale/') {
        return { 
          tabs: ['Production', 'Wholesale', 'Orders', 'Calendar', 'Invoices', 'Customers', 'Analytics'],
          links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/wholesale/orders', '/dashboard/wholesale/calendar', '/dashboard/wholesale/invoices', '/dashboard/wholesale', '/dashboard/analytics']
        };
      }
      // Default for other wholesale pages
      return { 
        tabs: ['Production', 'Wholesale', 'Orders', 'Calendar', 'Invoices', 'Customers', 'Analytics'],
        links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/wholesale/orders', '/dashboard/wholesale/calendar', '/dashboard/wholesale/invoices', '/dashboard/wholesale', '/dashboard/analytics']
      };
    }
    // Default tabs for production/analytics (not wholesale)
    return { 
      tabs: ['Production', 'Wholesale', 'Analytics'],
      links: ['/dashboard/production', '/dashboard/wholesale', '/dashboard/analytics']
    };
  }

  // Settings section - Subscription, Pricing, Content, Suppliers, Timers, Preferences
  // Show tabs on all settings pages for consistent navigation
  if (pathname.startsWith('/dashboard/account')) {
    return { 
      tabs: ['Subscription', 'Pricing', 'Content', 'Suppliers', 'Timers', 'Preferences'],
      links: ['/dashboard/account/subscription', '/dashboard/account/pricing', '/dashboard/account/content', '/dashboard/account/suppliers', '/dashboard/account/timers', '/dashboard/account/preferences']
    };
  }

  // Business
  if (pathname.startsWith('/dashboard/business')) {
    return { tabs: ['Settings', 'Billing', 'Team', 'Integrations'] };
  }

  // Safety section - Diary, Tasks, Compliance, Templates, Temperatures
  if (pathname.startsWith('/dashboard/safety')) {
    return { 
      tabs: ['Diary', 'Tasks', 'Compliance', 'Templates', 'Temperatures'],
      links: ['/dashboard/safety?page=diary', '/dashboard/safety?page=tasks', '/dashboard/safety?page=compliance', '/dashboard/safety?page=templates', '/dashboard/safety?page=temperatures']
    };
  }

  // Labels section - Allergen Sheets and Sales Labels
  if (pathname.startsWith('/dashboard/make/labels/allergen-sheets')) {
    return {
      tabs: ['Recent Updates', 'Select Recipes', 'Sheet Style', 'Preview', 'History'],
      links: [] // Will use URL params for navigation
    };
  }

  if (pathname.startsWith('/dashboard/make/labels/sales')) {
    return {
      tabs: ['Design Studio', 'Templates', 'Select Products', 'Preview', 'History'],
      links: [] // Will use URL params for navigation
    };
  }

  // Default tabs for dashboard
  return { tabs: ['Overview', 'Today', 'Week', 'Reports'] };
};

// Check if action buttons should be shown
const shouldShowActionButtons = (pathname: string): boolean => {
  // Show on recipes list page (exact match, not individual recipe pages)
  if (pathname === '/dashboard/recipes' || pathname === '/dashboard/recipes/') {
    return true;
  }
  // Show on ingredients page
  if (pathname === '/dashboard/ingredients' || pathname === '/dashboard/ingredients/') {
    return true;
  }
  // Hide on individual recipe pages (e.g., /dashboard/recipes/[id]) and all other pages
  return false;
};

export function FloatingNavigation({ onMenuClick, sidebarOpen }: FloatingNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeApp } = useAppContext();
  const { triggerNewAction } = usePageActions();
  // This will be undefined if not on a recipe page
  const recipeView = useRecipeView();
  const [activeTab, setActiveTab] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get("search") || "");
  const showActionButtons = shouldShowActionButtons(pathname);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine if Smart Import should be shown (recipes or ingredients pages)
  const showSmartImport = pathname === '/dashboard/recipes' || pathname === '/dashboard/ingredients' || pathname === '/dashboard/recipe-mixer';
  
  // Check if we're on a recipe page
  const isRecipePage = pathname.match(/^\/dashboard\/recipes\/[^/]+$/);

  // Sync search term with URL params
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    setSearchTerm(currentSearch);
    setLocalSearchTerm(currentSearch);
    // Auto-open search if there's a search term in URL
    if (currentSearch && !isSearchOpen) {
      setIsSearchOpen(true);
    }
  }, [searchParams]);

  // Debounced URL update - only update URL after user stops typing for 150ms
  useEffect(() => {
    // Clear any pending timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    // Only update URL if local search term differs from current search term
    if (localSearchTerm !== searchTerm) {
      urlUpdateTimeoutRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        
        if (localSearchTerm.trim()) {
          params.set("search", localSearchTerm.trim());
        } else {
          params.delete("search");
        }
        
        const newUrl = `${pathname}?${params.toString()}`;
        router.replace(newUrl);
      }, 150); // 150ms debounce for better performance
    }
    
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [localSearchTerm, searchTerm, router, searchParams, pathname]);

  // Auto-collapse search on mouse leave and timeout (only if search is empty)
  useEffect(() => {
    if (!isSearchOpen || localSearchTerm) return; // Don't auto-collapse if there's a search term

    const handleMouseLeave = () => {
      // Start timeout when mouse leaves search area
      searchTimeoutRef.current = setTimeout(() => {
        setIsSearchOpen(false);
      }, 3000); // 3 seconds timeout
    };

    const handleMouseEnter = () => {
      // Clear timeout when mouse enters search area
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };

    const container = searchContainerRef.current;
    if (container) {
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('mouseenter', handleMouseEnter);
    }

    return () => {
      if (container) {
        container.removeEventListener('mouseleave', handleMouseLeave);
        container.removeEventListener('mouseenter', handleMouseEnter);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isSearchOpen, searchTerm]);

  const tabConfig = getTabsForPath(pathname, activeApp?.id || null);
  const tabs = tabConfig.tabs;
  const tabLinks = tabConfig.links || [];
  
  // Create stable reference for tabLinks
  const tabLinksString = tabLinks.join(',');

  // Set active tab based on current pathname
  useEffect(() => {
    if (tabLinks.length > 0) {
      // For Safety pages, check the page param
      if (pathname.startsWith('/dashboard/safety')) {
        const pageParam = searchParams.get('page') || 'diary';
        const pageToIndex: Record<string, number> = {
          'diary': 0,
          'tasks': 1,
          'compliance': 2,
          'templates': 3,
          'temperatures': 4
        };
        setActiveTab(pageToIndex[pageParam] ?? 0);
      }
      // For Allergen Sheets pages, check the view param
      else if (pathname.startsWith('/dashboard/make/labels/allergen-sheets')) {
        const viewParam = searchParams.get('view') || 'recent-updates';
        const viewToIndex: Record<string, number> = {
          'recent-updates': 0,
          'select-recipes': 1,
          'sheet-style': 2,
          'preview': 3,
          'history': 4
        };
        setActiveTab(viewToIndex[viewParam] ?? 0);
      }
      // For Sales Labels pages, check the view param
      else if (pathname.startsWith('/dashboard/make/labels/sales')) {
        const viewParam = searchParams.get('view') || 'templates';
        const viewToIndex: Record<string, number> = {
          'design-studio': 0,
          'templates': 1,
          'select-products': 2,
          'preview': 3,
          'history': 4
        };
        setActiveTab(viewToIndex[viewParam] ?? 0);
      }
      // For settings pages, check exact match or starts with
      else if (pathname.startsWith('/dashboard/account')) {
        const currentIndex = tabLinks.findIndex(link => {
          // Exact match for sub-pages, or check if pathname starts with the link
          return pathname === link || pathname.startsWith(link + '/');
        });
        if (currentIndex >= 0) {
          setActiveTab(currentIndex);
        } else {
          // On main /dashboard/account page, don't highlight any tab
          setActiveTab(-1);
        }
      } else {
        // For wholesale pages, check exact matches first
        if (pathname.startsWith('/dashboard/wholesale')) {
          // Check for exact matches first (more specific routes)
          let activeIndex = -1;
          
          if (pathname.startsWith('/dashboard/wholesale/orders')) {
            activeIndex = tabLinks.findIndex(link => link === '/dashboard/wholesale/orders');
          } else if (pathname.startsWith('/dashboard/wholesale/calendar')) {
            activeIndex = tabLinks.findIndex(link => link === '/dashboard/wholesale/calendar');
          } else if (pathname.startsWith('/dashboard/wholesale/invoices')) {
            activeIndex = tabLinks.findIndex(link => link === '/dashboard/wholesale/invoices');
          } else if (pathname === '/dashboard/wholesale' || pathname === '/dashboard/wholesale/') {
            // Main wholesale page - highlight Customers tab (index 5)
            activeIndex = tabLinks.findIndex(link => link === '/dashboard/wholesale');
          }
          
          if (activeIndex >= 0) {
            setActiveTab(activeIndex);
          } else {
            // Fallback: find first matching link
            const fallbackIndex = tabLinks.findIndex(link => pathname.startsWith(link));
            setActiveTab(fallbackIndex >= 0 ? fallbackIndex : 0);
          }
        } else {
          const currentIndex = tabLinks.findIndex(link => pathname.startsWith(link));
          if (currentIndex >= 0) {
            setActiveTab(currentIndex);
          } else {
            setActiveTab(0);
          }
        }
      }
    } else {
      setActiveTab(0);
    }
  }, [pathname, tabLinksString, tabLinks.length, searchParams]); // Use stable dependencies

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // For Safety pages, update URL param instead of navigating
    if (pathname.startsWith('/dashboard/safety')) {
      const params = new URLSearchParams(searchParams.toString());
      const pageNames = ['diary', 'tasks', 'compliance', 'templates', 'temperatures'];
      params.set('page', pageNames[index] || 'diary');
      router.push(`${pathname}?${params.toString()}`);
    }
    // For Allergen Sheets pages, update view param
    else if (pathname.startsWith('/dashboard/make/labels/allergen-sheets')) {
      const params = new URLSearchParams(searchParams.toString());
      const viewNames = ['recent-updates', 'select-recipes', 'sheet-style', 'preview', 'history'];
      params.set('view', viewNames[index] || 'recent-updates');
      router.push(`${pathname}?${params.toString()}`);
    }
    // For Sales Labels pages, update view param
    else if (pathname.startsWith('/dashboard/make/labels/sales')) {
      const params = new URLSearchParams(searchParams.toString());
      const viewNames = ['design-studio', 'templates', 'select-products', 'preview', 'history'];
      params.set('view', viewNames[index] || 'templates');
      router.push(`${pathname}?${params.toString()}`);
    }
    // Navigate if links are provided
    else if (tabLinks && tabLinks[index]) {
      router.push(tabLinks[index]);
    }
  };

  return (
    <>
              {/* Floating Menu Button - Top Left */}
              {/* Mobile (iPhone): Larger button with safe area padding, matches desktop style */}
              {/* iPad & Desktop: Standard size */}
              <div className="fixed z-50 flex items-center gap-2 
                              top-4 left-4 max-md:top-[env(safe-area-inset-top,1rem)] max-md:left-[env(safe-area-inset-left,1rem)]
                              md:top-6 md:left-6">
                {!sidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMenuClick();
                    }}
                    className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer
                               max-md:p-4 max-md:shadow-xl max-md:border-2 max-md:border-gray-300/60
                               md:p-3
                               active:scale-95 max-md:active:scale-90"
                    aria-label="Toggle menu"
                    type="button"
                  >
                    <svg className="text-gray-700 max-md:w-6 max-md:h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                
                {/* Back Button - Only show on recipe pages when sidebar is closed */}
                {isRecipePage && !sidebarOpen && (
                  <a
                    href="/dashboard/recipes"
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full hover:bg-white hover:shadow-xl transition-all
                             max-md:px-5 max-md:py-3 max-md:shadow-xl max-md:border-2 max-md:border-gray-300/60
                             md:px-4 md:py-2
                             active:scale-95 max-md:active:scale-90"
                  >
                    <svg className="text-gray-700 max-md:w-5 max-md:h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">Back</span>
                  </a>
                )}
              </div>

      {/* Floating Navigation Tabs or Recipe View Switchers - Top Center */}
      {/* Mobile (iPhone): Scrollable tabs with smaller padding, positioned below menu button */}
      {/* iPad & Desktop: Centered tabs with standard padding */}
      {isRecipePage && recipeView ? (
        // Recipe View Switchers - with scroll hiding
        <ScrollHideNav hideOnScroll={true} threshold={50}>
          <div className={`fixed z-50
                          max-md:top-[calc(env(safe-area-inset-top,1rem)+4rem)] max-md:left-4 max-md:right-4 max-md:w-auto
                          md:top-6 md:left-1/2 md:-translate-x-1/2
                          ${sidebarOpen ? 'md:left-[340px] md:translate-x-0' : ''}`}>
            <div className="flex items-center gap-1.5 md:gap-2 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 md:px-3 py-2 overflow-x-auto max-md:scrollbar-hide">
              <button
                onClick={() => recipeView.setViewMode("whole")}
                className={`rounded-full font-medium transition-all duration-200 flex-shrink-0
                           max-md:px-3 max-md:py-1.5 max-md:text-xs
                           md:px-4 lg:px-5 md:py-1.5 md:text-sm
                           ${
                  recipeView.viewMode === "whole"
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Whole Recipe
              </button>

              <button
                onClick={() => recipeView.setViewMode("steps")}
                className={`rounded-full font-medium transition-all duration-200 flex-shrink-0
                           max-md:px-3 max-md:py-1.5 max-md:text-xs
                           md:px-4 lg:px-5 md:py-1.5 md:text-sm
                           ${
                  recipeView.viewMode === "steps"
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Steps
              </button>

              <button
                onClick={() => recipeView.setViewMode("photos")}
                className={`rounded-full font-medium transition-all duration-200 flex-shrink-0
                           max-md:px-3 max-md:py-1.5 max-md:text-xs
                           md:px-4 lg:px-5 md:py-1.5 md:text-sm
                           ${
                  recipeView.viewMode === "photos"
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Photo View
              </button>
            </div>
          </div>
        </ScrollHideNav>
      ) : tabs.length > 0 ? (
        // Regular Navigation Tabs - with scroll hiding
        <ScrollHideNav hideOnScroll={true} threshold={50}>
          <div className={`fixed z-50
                          max-md:top-[calc(env(safe-area-inset-top,1rem)+4rem)] max-md:left-4 max-md:right-4 max-md:w-auto
                          md:top-6 md:left-1/2 md:-translate-x-1/2
                          ${sidebarOpen ? 'md:left-[340px] md:translate-x-0' : ''}`}>
            <div className="flex items-center gap-1.5 md:gap-2 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 md:px-3 py-2 overflow-x-auto max-md:scrollbar-hide">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(index)}
                className={`rounded-full font-medium transition-all duration-200 flex-shrink-0
                           max-md:px-3 max-md:py-1.5 max-md:text-xs
                           md:px-5 md:py-1.5 md:text-sm
                           ${
                  activeTab === index && activeTab >= 0
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
            </div>
          </div>
        </ScrollHideNav>
      ) : null}

      {/* Recipe Page Action Buttons - Edit & Print - Top Right when on recipe page */}
      {/* Mobile (iPhone): Positioned with safe area and smaller spacing */}
      {/* iPad & Desktop: Standard positioning */}
      {isRecipePage && recipeView && (
        <div className="fixed z-30 flex items-center gap-2 flex-wrap
                       max-md:top-[calc(env(safe-area-inset-top,1rem)+1rem)] max-md:right-4 max-md:gap-1.5
                       md:top-6 md:right-6">
          <button
            onClick={() => {
              if (recipeView.viewMode === "edit" && recipeView.onSave) {
                recipeView.onSave();
              } else {
                recipeView.setViewMode(recipeView.viewMode === "edit" ? "steps" : "edit");
              }
            }}
            disabled={recipeView.isSaving}
            className={`bg-white/80 backdrop-blur-xl shadow-md border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-lg transition-all flex items-center gap-2
                       max-md:px-3 max-md:py-1.5 max-md:gap-1.5
                       md:px-4 md:py-2
                       ${recipeView.isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
            title={recipeView.viewMode === "edit" ? "Save" : "Edit"}
          >
            {recipeView.viewMode === "edit" ? (
              <>
                {recipeView.isSaving ? (
                  <svg className="text-gray-700 max-md:w-3.5 max-md:h-3.5 md:w-4 md:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="text-gray-700 max-md:w-3.5 max-md:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-gray-700 font-medium max-md:text-xs md:text-sm">Save</span>
              </>
            ) : (
              <>
                <svg className="text-gray-700 max-md:w-3.5 max-md:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-gray-700 font-medium max-md:text-xs md:text-sm">Edit</span>
              </>
            )}
          </button>

          {recipeView.onPrint && (
            <button
              onClick={recipeView.onPrint}
              className="bg-white/80 backdrop-blur-xl shadow-md border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-lg transition-all flex items-center gap-2
                       max-md:px-3 max-md:py-1.5 max-md:gap-1.5
                       md:px-4 md:py-2"
              title="Print"
            >
              <svg className="text-gray-700 max-md:w-3.5 max-md:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="text-gray-700 font-medium max-md:text-xs md:text-sm">Print</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Action Buttons - Top Right - Only show on recipes and ingredients list pages */}
      {/* Mobile (iPhone): Positioned with safe area, smaller buttons, stacked vertically if needed */}
      {/* iPad & Desktop: Standard positioning */}
      {showActionButtons && (
        <div className="fixed z-30 flex items-center gap-2 flex-wrap
                       max-md:top-[calc(env(safe-area-inset-top,1rem)+1rem)] max-md:right-4 max-md:gap-1.5
                       md:top-6 md:right-6">
          {/* Search Button with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 flex-shrink-0
                         max-md:p-2.5
                         md:p-3
                         ${isSearchOpen ? 'bg-emerald-100 border-emerald-300' : ''}`}
              aria-label="Search"
            >
              <svg className={`max-md:w-4 max-md:h-4 md:w-4.5 md:h-4.5 ${isSearchOpen ? 'text-emerald-600' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Search Input - Slides down below search button when active */}
            {isSearchOpen && (
              <div 
                ref={searchContainerRef}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex items-center bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-4 py-2.5 w-64 animate-slide-down z-50"
              >
                <svg className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={localSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalSearchTerm(value);
                    // Dispatch custom event for instant filtering on ingredients page
                    if (pathname.startsWith("/dashboard/ingredients")) {
                      window.dispatchEvent(new CustomEvent('ingredient-search-change', { detail: value }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                      setLocalSearchTerm("");
                      setSearchTerm("");
                      if (pathname.startsWith("/dashboard/ingredients")) {
                        window.dispatchEvent(new CustomEvent('ingredient-search-change', { detail: "" }));
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Don't collapse if clicking within the search container
                    if (!searchContainerRef.current?.contains(e.relatedTarget as Node)) {
                      if (!localSearchTerm) {
                        // Small delay to allow clicking the clear button
                        setTimeout(() => {
                          if (!localSearchTerm) {
                            setIsSearchOpen(false);
                          }
                        }, 200);
                      }
                    }
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
                  placeholder={
                    pathname.startsWith("/dashboard/recipes")
                      ? "Search recipes..."
                      : pathname.startsWith("/dashboard/ingredients")
                      ? "Search ingredients..."
                      : "Search..."
                  }
                  autoFocus
                />
                {localSearchTerm && (
                  <button
                    onClick={() => {
                      setLocalSearchTerm("");
                      setSearchTerm("");
                    }}
                    className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Other Action Buttons */}
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 flex-shrink-0
                       max-md:p-2.5
                       md:p-3"
            aria-label="Filter"
          >
            <svg className="text-gray-700 max-md:w-4 max-md:h-4 md:w-4.5 md:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          {showSmartImport && (
            <SmartImportButton type={pathname.startsWith('/dashboard/recipes') ? 'recipes' : 'ingredients'} />
          )}
          <button 
            onClick={triggerNewAction}
            className="bg-blue-500 shadow-lg rounded-full hover:bg-blue-600 hover:shadow-xl transition-all duration-200 flex items-center gap-2 flex-shrink-0
                       max-md:px-3 max-md:py-2 max-md:gap-1.5
                       md:px-5 md:py-3"
          >
            <svg className="text-white max-md:w-4 max-md:h-4 md:w-4.5 md:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white font-medium max-md:text-xs md:text-sm">New</span>
          </button>
        </div>
      )}
      
      {/* Floating Filter */}
      <FloatingFilter isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </>
  );
}

