"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getFilteredNavigationItems } from "@/lib/navigation-config";
import { useAppContext } from "./AppContextProvider";
import { usePageActions } from "./PageActionContext";
import { FloatingFilter } from "./FloatingFilter";
import { SmartImportButton } from "./SmartImportButton";
import { useRecipeView } from "./RecipeViewContext";

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

  // Teams section - Scheduling, Rota, Holidays, Staff
  if (pathname.startsWith('/dashboard/staff') || pathname.startsWith('/dashboard/team')) {
    return { 
      tabs: ['Scheduling', 'Rota', 'Holidays', 'Staff'],
      links: ['/dashboard/staff', '/dashboard/staff', '/dashboard/staff', '/dashboard/staff']
    };
  }

  // Production section - show tabs for easy navigation between production pages
  if (pathname.startsWith('/dashboard/production') || pathname.startsWith('/dashboard/wholesale') || pathname.startsWith('/dashboard/analytics')) {
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
        const currentIndex = tabLinks.findIndex(link => pathname.startsWith(link));
        if (currentIndex >= 0) {
          setActiveTab(currentIndex);
        } else {
          setActiveTab(0);
        }
      }
    } else {
      setActiveTab(0);
    }
  }, [pathname, tabLinksString, tabLinks.length, searchParams]); // Use stable dependencies

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // Navigate if links are provided
    if (tabLinks && tabLinks[index]) {
      // For Safety pages, update URL param instead of navigating
      if (pathname.startsWith('/dashboard/safety')) {
        const params = new URLSearchParams(searchParams.toString());
        const pageNames = ['diary', 'tasks', 'compliance', 'templates', 'temperatures'];
        params.set('page', pageNames[index] || 'diary');
        router.push(`${pathname}?${params.toString()}`);
      } else {
        router.push(tabLinks[index]);
      }
    }
  };

  return (
    <>
              {/* Floating Menu Button - Top Left */}
              <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
                {!sidebarOpen && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onMenuClick();
                    }}
                    className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 cursor-pointer"
                    aria-label="Toggle menu"
                    type="button"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                
                {/* Back Button - Only show on recipe pages when sidebar is closed */}
                {isRecipePage && !sidebarOpen && (
                  <a
                    href="/dashboard/recipes"
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 px-4 py-2 rounded-full hover:bg-white hover:shadow-xl transition-all"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">Back</span>
                  </a>
                )}
              </div>

      {/* Floating Navigation Tabs or Recipe View Switchers - Top Center */}
      {isRecipePage && recipeView ? (
        // Recipe View Switchers
        <div className={`fixed top-6 z-50 transition-all duration-300 ${
          sidebarOpen 
            ? 'left-[340px]' // Start after sidebar (320px width + 20px margin)
            : 'left-1/2 -translate-x-1/2' // Center when sidebar closed
        }`}>
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
            <button
              onClick={() => recipeView.setViewMode("whole")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                recipeView.viewMode === "whole"
                  ? 'bg-white shadow-md text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Whole Recipe
            </button>

            <button
              onClick={() => recipeView.setViewMode("steps")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                recipeView.viewMode === "steps"
                  ? 'bg-white shadow-md text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Steps
            </button>

            <button
              onClick={() => recipeView.setViewMode("photos")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                recipeView.viewMode === "photos"
                  ? 'bg-white shadow-md text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Photo View
            </button>
          </div>
        </div>
      ) : tabs.length > 0 ? (
        // Regular Navigation Tabs
        <div className={`fixed top-6 z-50 transition-all duration-300 ${
          sidebarOpen 
            ? 'left-[340px]' // Start after sidebar (320px width + 20px margin)
            : 'left-1/2 -translate-x-1/2' // Center when sidebar closed
        }`}>
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabClick(index)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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
      ) : null}

      {/* Recipe Page Action Buttons - Edit & Print - Top Right when on recipe page */}
      {isRecipePage && recipeView && (
        <div className="fixed top-6 right-6 z-30 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (recipeView.viewMode === "edit" && recipeView.onSave) {
                recipeView.onSave();
              } else {
                recipeView.setViewMode(recipeView.viewMode === "edit" ? "steps" : "edit");
              }
            }}
            disabled={recipeView.isSaving}
            className={`px-4 py-2 bg-white/80 backdrop-blur-xl shadow-md border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-lg transition-all flex items-center gap-2 ${
              recipeView.isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={recipeView.viewMode === "edit" ? "Save" : "Edit"}
          >
            {recipeView.viewMode === "edit" ? (
              <>
                {recipeView.isSaving ? (
                  <svg className="w-4 h-4 text-gray-700 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-700">Save</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">Edit</span>
              </>
            )}
          </button>

          {recipeView.onPrint && (
            <button
              onClick={recipeView.onPrint}
              className="px-4 py-2 bg-white/80 backdrop-blur-xl shadow-md border border-gray-200/50 rounded-xl hover:bg-white hover:shadow-lg transition-all flex items-center gap-2"
              title="Print"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Print</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Action Buttons - Top Right - Only show on recipes and ingredients list pages */}
      {showActionButtons && (
        <div className="fixed top-6 right-6 z-30 flex items-center gap-2 flex-wrap">
          {/* Search Button with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 flex-shrink-0 ${
                isSearchOpen ? 'bg-emerald-100 border-emerald-300' : ''
              }`}
              aria-label="Search"
            >
              <svg className={`w-4.5 h-4.5 ${isSearchOpen ? 'text-emerald-600' : 'text-gray-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200 flex-shrink-0"
            aria-label="Filter"
          >
            <svg className="w-4.5 h-4.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          {showSmartImport && (
            <SmartImportButton type={pathname.startsWith('/dashboard/recipes') ? 'recipes' : 'ingredients'} />
          )}
          <button 
            onClick={triggerNewAction}
            className="bg-blue-500 shadow-lg px-5 py-3 rounded-full hover:bg-blue-600 hover:shadow-xl transition-all duration-200 flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white font-medium text-sm">New</span>
          </button>
        </div>
      )}
      
      {/* Floating Filter */}
      <FloatingFilter isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </>
  );
}

