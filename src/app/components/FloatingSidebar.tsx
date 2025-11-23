"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_NAVIGATION_ITEMS, getFilteredNavigationItems } from "@/lib/navigation-config";
import { SectionUnlockModal } from "./unlock/SectionUnlockModal";
import { FeatureModuleName } from "@/lib/stripe-features";
import { getAppConfig, appExists, getAllApps } from "@/lib/apps/registry";
import { getAppAwareRoute, getAppFromRoute } from "@/lib/app-routes";
import type { App } from "@/lib/apps/types";

interface FloatingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function FloatingSidebarInner({ isOpen, onClose }: FloatingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Detect app from route path (e.g., /bake/*) or query params (e.g., ?app=plato_bake)
  const appFromRoute = getAppFromRoute(pathname);
  const appParam = searchParams?.get("app");
  // Prioritize route detection over query params, default to plato only if on /dashboard
  let currentApp: App = "plato";
  if (appFromRoute) {
    currentApp = appFromRoute;
  } else if (appParam && appExists(appParam)) {
    currentApp = appParam;
  }
  const appConfig = getAppConfig(currentApp);
  const appFeatures = appConfig?.features || [];
  
  const [searchTerm, setSearchTerm] = useState("");
  const [unlockStatus, setUnlockStatus] = useState<Record<string, { unlocked: boolean; isTrial: boolean }> | null>(null);
  const [unlockModal, setUnlockModal] = useState<FeatureModuleName | null>(null);
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);
  const [userApps, setUserApps] = useState<Array<{ id: App; name: string; hasAccess: boolean }>>([]);

  // Fetch user's apps for app switcher
  useEffect(() => {
    fetch("/api/user/apps")
      .then((res) => res.json())
      .then((data) => {
        if (data.apps) {
          setUserApps(data.apps.map((app: any) => ({
            id: app.id,
            name: app.name,
            hasAccess: app.hasAccess,
          })));
        }
      })
      .catch((err) => console.error("Failed to fetch user apps:", err));
  }, []);

  // Fetch unlock status on mount and when pathname changes
  const fetchUnlockStatus = () => {
    fetch("/api/features/unlock-status", {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.unlockStatus) {
          setUnlockStatus(data.unlockStatus);
        } else if (data.error) {
          console.error("API error:", data.error, data.details);
          setUnlockStatus({
            recipes: { unlocked: true, isTrial: true },
            production: { unlocked: false, isTrial: false },
            make: { unlocked: false, isTrial: false },
            teams: { unlocked: false, isTrial: false },
            safety: { unlocked: false, isTrial: false },
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch unlock status:", err);
        setUnlockStatus({
          recipes: { unlocked: true, isTrial: true },
          production: { unlocked: false, isTrial: false },
          make: { unlocked: false, isTrial: false },
          teams: { unlocked: false, isTrial: false },
          safety: { unlocked: false, isTrial: false },
        });
      });
  };

  useEffect(() => {
    fetchUnlockStatus();
  }, []);

  useEffect(() => {
    fetchUnlockStatus();
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      fetchUnlockStatus();
    }
  }, [isOpen]);

  // Get filtered navigation items based on app features
  const navigationItems = getFilteredNavigationItems(currentApp, appFeatures);
  
  // Flatten all navigation items into a simple list (no sections/dropdowns)
  const allNavItems = useMemo(() => {
    // Get dashboard first
    const dashboard = navigationItems.find(item => item.value === 'dashboard');
    
    // Get all other items, filtering by app features
    const otherItems = navigationItems
      .filter(item => {
        if (item.value === 'dashboard' || item.value === 'account') return false;
        
        // Map appContext to feature names
        const appContextToFeature: Record<string, string> = {
          'recipes': 'recipes',
          'production': 'production',
          'make': 'make',
          'teams': 'teams',
          'safety': 'safety',
        };
        
        const featureName = appContextToFeature[item.appContext];
        if (featureName && appFeatures.length > 0) {
          return appFeatures.includes(featureName);
        }
        
        // Show global items
        if (item.appContext === 'global') return true;
        
        return true;
      })
      .filter(item => {
        // Check unlock status for locked features
        if (item.appContext === 'production' && !unlockStatus?.production?.unlocked) return false;
        if (item.appContext === 'make' && !unlockStatus?.make?.unlocked) return false;
        if (item.appContext === 'teams' && !unlockStatus?.teams?.unlocked) return false;
        if (item.appContext === 'safety' && !unlockStatus?.safety?.unlocked) return false;
        return true;
      });
    
    const items = dashboard ? [dashboard, ...otherItems] : otherItems;
    
    // Filter by search term if present
    if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
      return items.filter(item => 
      item.label.toLowerCase().includes(searchLower) ||
      item.value.toLowerCase().includes(searchLower) ||
      item.href.toLowerCase().includes(searchLower)
    );
    }

    return items;
  }, [navigationItems, appFeatures, unlockStatus, searchTerm]);

  // Close sidebar when route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

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
  }, [isOpen]);

  const handleAppSwitch = (appId: App) => {
    // Update URL with app-specific route
    if (appId === "plato") {
      router.push("/dashboard");
    } else if (appId === "plato_bake") {
      router.push("/bake");
    } else {
      // For future apps, use the pattern
      const appPrefix = `/${appId.replace("_", "-")}`;
      router.push(appPrefix);
    }
    setShowAppSwitcher(false);
  };

  // Helper function to generate app-aware routes
  const getAppAwareHref = (href: string): string => {
    // Ensure we're using the correct app - prioritize route detection
    const appToUse = appFromRoute || currentApp;
    let convertedRoute = getAppAwareRoute(href, appToUse);
    
    // Final safety check: ensure /plato-bake is always converted to /bake
    if (convertedRoute.includes("/plato-bake")) {
      convertedRoute = convertedRoute.replace(/\/plato-bake/g, "/bake");
    }
    
    return convertedRoute;
  };

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
      <div className={`fixed left-0 top-0 h-full w-80 bg-white flex flex-col z-50 transform transition-transform duration-300 ease-out
                      max-md:pt-[env(safe-area-inset-top,0px)] max-md:h-[100dvh]
                      ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-gray-200 max-md:pt-[env(safe-area-inset-top,0.75rem)]">
          {/* App Switcher - Clickable app name */}
          <div className="relative mb-3">
            <button 
              onClick={() => setShowAppSwitcher(!showAppSwitcher)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-base font-semibold text-gray-900 flex-1">{appConfig.name}</span>
              <svg className={`w-4 h-4 text-gray-400 transform transition-transform ${showAppSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* App Switcher Dropdown */}
            {showAppSwitcher && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {userApps.length > 0 ? (
                  userApps.map((app) => {
                    const appConfigItem = getAppConfig(app.id);
                    const isCurrentApp = currentApp === app.id;
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleAppSwitch(app.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          isCurrentApp ? 'bg-[var(--brand-secondary)]' : ''
                        }`}
                      >
                        <span className={`text-sm font-medium ${isCurrentApp ? 'text-[var(--brand-primary)]' : 'text-gray-700'}`}>
                          {appConfigItem.name}
                        </span>
                        {!app.hasAccess && app.id !== "plato" && (
                          <span className="ml-auto text-xs text-gray-400">Locked</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No apps available</div>
                )}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-100 rounded-lg pl-9 pr-9 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/50 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items - Simple list, no dropdowns */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            {allNavItems.map(item => {
              // Preserve app context in the URL - convert first
              let appAwareHref = getAppAwareHref(item.href);
              
              // Final safety check: ensure no /plato-bake routes slip through
              if (appAwareHref.includes("/plato-bake")) {
                appAwareHref = appAwareHref.replace(/\/plato-bake/g, "/bake");
              }
              
              // Check active state using the converted app-aware href
              const normalizedPathname = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
              const normalizedHref = appAwareHref.endsWith("/") && appAwareHref !== "/" ? appAwareHref.slice(0, -1) : appAwareHref;
              const isActive = normalizedPathname === normalizedHref || 
                (normalizedHref !== "/dashboard" && normalizedHref !== "/bake" && normalizedPathname.startsWith(normalizedHref + "/"));
              
              const isLocked = 
                (item.appContext === 'production' && !unlockStatus?.production?.unlocked) ||
                (item.appContext === 'make' && !unlockStatus?.make?.unlocked) ||
                (item.appContext === 'teams' && !unlockStatus?.teams?.unlocked) ||
                (item.appContext === 'safety' && !unlockStatus?.safety?.unlocked);
              
                      return (
                        <a
                          key={item.value}
                  href={appAwareHref}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      // Show unlock modal for locked features
                      if (item.appContext === 'production') setUnlockModal("production");
                      if (item.appContext === 'make') setUnlockModal("make");
                      if (item.appContext === 'teams') setUnlockModal("teams");
                      if (item.appContext === 'safety') setUnlockModal("safety");
                    } else {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
                  <span className="flex-1">{item.label}</span>
                  {isLocked && (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                        </a>
                      );
            })}
            </div>
          </div>

        {/* Bottom Section - Settings & Actions */}
        <div className="border-t border-gray-200 px-4 py-3 space-y-2">
          {/* Settings */}
          {settingsItem && (
              <a
              href={getAppAwareHref(settingsItem.href)}
                onClick={onClose}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg ${
                  pathname === settingsItem.href || pathname.startsWith(settingsItem.href)
                  ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
              <div className="w-5 h-5 flex-shrink-0">{settingsItem.icon}</div>
              <span>{settingsItem.label}</span>
              </a>
          )}
              
              {/* Logout Button */}
              <button
                onClick={async () => {
                  onClose();
                  try {
                    await fetch('/api/logout', { method: 'POST' });
                    router.push('/');
                    router.refresh();
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
              >
            <div className="w-5 h-5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
            <span>Logout</span>
              </button>
        </div>
      </div>

      {/* Unlock Modal */}
      {unlockModal && (
        <SectionUnlockModal
          isOpen={!!unlockModal}
          onClose={() => setUnlockModal(null)}
          moduleName={unlockModal}
        />
      )}
    </>
  );
}

export function FloatingSidebar({ isOpen, onClose }: FloatingSidebarProps) {
  return (
    <Suspense fallback={null}>
      <FloatingSidebarInner isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}
