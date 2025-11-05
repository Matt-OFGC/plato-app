"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ALL_NAVIGATION_ITEMS, getFilteredNavigationItems } from "@/lib/navigation-config";
import { useAppContext } from "./AppContextProvider";

// Pre-compute production items since ALL_NAVIGATION_ITEMS is constant
const PRODUCTION_ITEMS_BY_APPCONTEXT = ALL_NAVIGATION_ITEMS.filter(item => 
  item.appContext === 'production'
);

// Fallback: production items by value if appContext filter finds nothing
const PRODUCTION_ITEMS_BY_VALUE = PRODUCTION_ITEMS_BY_APPCONTEXT.length === 0
  ? ALL_NAVIGATION_ITEMS.filter(item => 
      ['production', 'wholesale', 'analytics'].includes(item.value)
    )
  : PRODUCTION_ITEMS_BY_APPCONTEXT;

const PRODUCTION_ITEMS = PRODUCTION_ITEMS_BY_VALUE;

// Pre-compute safety items - use same pattern as production but compute inside component
// This ensures ALL_NAVIGATION_ITEMS is fully loaded
const getSafetyItems = () => {
  // First try by appContext
  const byAppContext = ALL_NAVIGATION_ITEMS.filter(item => 
    item.appContext === 'safety'
  );
  if (byAppContext.length > 0) {
    return byAppContext;
  }
  // Fallback: safety items by value if appContext filter finds nothing
  const byValue = ALL_NAVIGATION_ITEMS.filter(item => 
    item.value === 'safety'
  );
  if (byValue.length > 0) {
    return byValue;
  }
  // Last resort: return a hardcoded safety item if nothing found
  // This ensures it always shows up
  return [{
    value: "safety",
    href: "/dashboard/safety",
    label: "Safety",
    shortLabel: "Safety",
    appContext: "safety",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }];
};

interface FloatingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingSidebar({ isOpen, onClose }: FloatingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeApp, switchToApp } = useAppContext();
  const [expandedSections, setExpandedSections] = useState({
    recipes: true,
    teams: true,
    production: true,
    make: true,
    healthSafety: true
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Get all navigation items for global search
  const allNavigationItems = ALL_NAVIGATION_ITEMS;
  
  // Filter navigation items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return allNavigationItems;
    }
    const searchLower = searchTerm.toLowerCase();
    return allNavigationItems.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.value.toLowerCase().includes(searchLower) ||
      item.href.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, allNavigationItems]);

  const navigationItems = getFilteredNavigationItems(activeApp?.id || null);

  // Close sidebar when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only depend on pathname, not onClose

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen, not onClose

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Group navigation items by app context
  const recipesItems = useMemo(() => {
    const items = navigationItems.filter(item => 
      item.appContext === 'recipes' && item.value !== 'dashboard' && item.value !== 'production'
    );
    if (searchTerm.trim()) {
      return items.filter(item => 
        filteredItems.some(fi => fi.value === item.value)
      );
    }
    return items;
  }, [navigationItems, searchTerm, filteredItems]);

  const teamsItems = useMemo(() => {
    const items = navigationItems.filter(item => 
      item.appContext === 'teams'
    );
    if (searchTerm.trim()) {
      return items.filter(item => 
        filteredItems.some(fi => fi.value === item.value)
      );
    }
    return items;
  }, [navigationItems, searchTerm, filteredItems]);

  const productionItems = useMemo(() => {
    // Use pre-computed production items for better performance
    if (searchTerm.trim()) {
      return PRODUCTION_ITEMS.filter(item =>
        filteredItems.some(fi => fi.value === item.value)
      );
    }
    return PRODUCTION_ITEMS;
  }, [searchTerm, filteredItems]);

  const makeItems = useMemo(() => {
    const items = ALL_NAVIGATION_ITEMS.filter(item =>
      item.appContext === 'make'
    );
    if (searchTerm.trim()) {
      return items.filter(item =>
        filteredItems.some(fi => fi.value === item.value)
      );
    }
    return items;
  }, [searchTerm, filteredItems]);

  // Health & Safety items - compute on demand to ensure ALL_NAVIGATION_ITEMS is loaded
  const healthSafetyItems = useMemo(() => {
    const safetyItems = getSafetyItems();
    // Debug log
    if (typeof window !== 'undefined' && safetyItems.length === 0) {
      console.log('🛡️ Debug - ALL_NAVIGATION_ITEMS:', ALL_NAVIGATION_ITEMS.length);
      console.log('🛡️ Debug - Items with safety appContext:', ALL_NAVIGATION_ITEMS.filter(i => i.appContext === 'safety'));
      console.log('🛡️ Debug - Items with safety value:', ALL_NAVIGATION_ITEMS.filter(i => i.value === 'safety'));
    }
    if (searchTerm.trim()) {
      return safetyItems.filter(item => 
        filteredItems.some(fi => fi.value === item.value)
      );
    }
    return safetyItems;
  }, [searchTerm, filteredItems]);

  // Settings item (move to bottom)
  const settingsItem = navigationItems.find(item => item.value === 'account');

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/70 backdrop-blur-2xl border-r border-gray-200/80 flex flex-col z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-gray-200/80">
          <div className="flex items-center justify-end mb-3">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100/80 rounded-lg pl-9 pr-9 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {/* Dashboard Link */}
            {(() => {
              const dashboardItem = ALL_NAVIGATION_ITEMS.find(item => item.value === 'dashboard');
              if (!dashboardItem) return null;
              const isActive = pathname === dashboardItem.href || pathname.startsWith(dashboardItem.href);
              return (
                <div className="px-2 pt-2 pb-1.5 border-b border-gray-200/80">
                  <a
                    href={dashboardItem.href}
                    onClick={onClose}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="w-4 h-4">{dashboardItem.icon}</div>
                    <span className="font-medium">{dashboardItem.label}</span>
                  </a>
                </div>
              );
            })()}

            {/* Recipes Section */}
            {(recipesItems.length > 0 || !searchTerm.trim()) && (
              <div className="px-2 py-2">
                <button
                  onClick={() => toggleSection('recipes')}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
                >
                  <span>Recipes</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Detail</span>
                    <svg className={`w-3 h-3 transform transition-transform ${expandedSections.recipes ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {expandedSections.recipes && (
                  <div className="mt-1 space-y-0.5">
                    {recipesItems.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <a
                          key={item.value}
                          href={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 ${isActive ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Production Section - Always show */}
            <div className="px-2 py-2">
                <button
                  onClick={() => toggleSection('production')}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
                >
                  <span>PRODUCTION DETAIL</span>
                  <svg className={`w-3 h-3 transform transition-transform ${expandedSections.production ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedSections.production && (
                  <div className="mt-1 space-y-0.5">
                    {productionItems.length > 0 ? (
                      productionItems.map(item => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                          <a
                            key={item.value}
                            href={item.href}
                            onClick={onClose}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-500/10 text-blue-600'
                                : 'text-gray-700 hover:bg-gray-100/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <svg className={`w-3.5 h-3.5 ${isActive ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                              <span className="font-medium">{item.label}</span>
                            </div>
                          </a>
                        );
                      })
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-400 italic">
                        No items found
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* Make Section - Label Generator */}
            {(makeItems.length > 0 || !searchTerm.trim()) && (
              <div className="px-2 py-2">
                <button
                  onClick={() => toggleSection('make')}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
                >
                  <span>MAKE</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Detail</span>
                    <svg className={`w-3 h-3 transform transition-transform ${expandedSections.make ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSections.make && (
                  <div className="mt-1 space-y-0.5">
                    {makeItems.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <a
                          key={item.value}
                          href={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 ${isActive ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Teams Section */}
            {(teamsItems.length > 0 || !searchTerm.trim()) && (
              <div className="px-2 py-2">
                <button
                  onClick={() => toggleSection('teams')}
                  className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
                >
                  <span>Teams</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Detail</span>
                    <svg className={`w-3 h-3 transform transition-transform ${expandedSections.teams ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {expandedSections.teams && (
                  <div className="mt-1 space-y-0.5">
                    {teamsItems.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <a
                          key={item.value}
                          href={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 ${isActive ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Hygiene & Safety Section - Always show */}
            <div className="px-2 py-2">
              <button
                onClick={() => toggleSection('healthSafety')}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
              >
                <span>Hygiene & Safety</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Detail</span>
                  <svg className={`w-3 h-3 transform transition-transform ${expandedSections.healthSafety ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {expandedSections.healthSafety && (
                <div className="mt-1 space-y-0.5">
                  {healthSafetyItems.length > 0 ? (
                    healthSafetyItems.map(item => {
                      const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <a
                          key={item.value}
                          href={item.href}
                          onClick={onClose}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-500/10 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className={`w-3.5 h-3.5 ${isActive ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-400 italic">
                      No items found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Settings at Bottom */}
          {settingsItem && (
            <div className="px-2 py-2 border-t border-gray-200/80 mt-auto">
              <a
                href={settingsItem.href}
                onClick={onClose}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === settingsItem.href || pathname.startsWith(settingsItem.href)
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100/60'
                }`}
              >
                <div className="w-4 h-4">{settingsItem.icon}</div>
                <span className="font-medium">{settingsItem.label}</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

