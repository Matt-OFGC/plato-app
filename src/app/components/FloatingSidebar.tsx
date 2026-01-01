"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_NAVIGATION_ITEMS } from "@/lib/navigation-config";
import { getAppConfig } from "@/lib/apps/registry";
import type { App } from "@/lib/apps/types";

interface FloatingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function FloatingSidebarInner({ isOpen, onClose }: FloatingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // MVP: Always use 'plato' app - no app detection needed
  const currentApp: App = "plato";
  const appConfig = getAppConfig(currentApp);
  
  const [searchTerm, setSearchTerm] = useState("");
  
  // MVP: No app switcher needed - removed userApps fetch

  // All MVP features are unlocked - no need to fetch unlock status

  // MVP: Use ALL_NAVIGATION_ITEMS directly (bypass any function that might be cached)
  // Explicitly define which items should show (whitelist approach)
  const MVP_ITEM_VALUES = ['dashboard', 'ingredients', 'recipes', 'recipe-mixer', 'team', 'production', 'wholesale', 'account'];
  
  // Flatten all navigation items into a simple list (no sections/dropdowns)
  const allNavItems = useMemo(() => {
    // Filter to ONLY MVP items from ALL_NAVIGATION_ITEMS (direct import, no function call)
    const mvpItems = ALL_NAVIGATION_ITEMS.filter(item => MVP_ITEM_VALUES.includes(item.value));
    
    // Get dashboard first
    const dashboard = mvpItems.find(item => item.value === 'dashboard');
    
    // Get all other MVP items (exclude dashboard and account - account shown separately at bottom)
    const otherItems = mvpItems
      .filter(item => {
        // Exclude dashboard and account (account shown separately at bottom)
        if (item.value === 'dashboard' || item.value === 'account') return false;
        
        // Only show MVP items
        return MVP_ITEM_VALUES.includes(item.value);
      });
    
    const items = dashboard ? [dashboard, ...otherItems] : otherItems;
    
    // Debug: Log what we're getting
    if (typeof window !== 'undefined') {
      console.log('🔍 FloatingSidebar Debug:', {
        currentApp,
        allNavigationItemsFromConfig: ALL_NAVIGATION_ITEMS.map(i => i.value),
        mvpItems: mvpItems.map(i => i.value),
        nonMvpItems: ALL_NAVIGATION_ITEMS.filter(i => !MVP_ITEM_VALUES.includes(i.value)).map(i => i.value),
        finalItems: items.map(i => i.value)
      });
    }
    
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
  }, [searchTerm]); // Removed navigationItems dependency - using direct import

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

  // MVP: No app switching - removed handleAppSwitch

  // Helper function to generate routes (MVP: no app-aware conversion needed)
  const getAppAwareHref = (href: string): string => {
    // MVP: Just return the href as-is, no app conversion needed
    return href;
  };

  const settingsItem = ALL_NAVIGATION_ITEMS.find(item => item.value === 'account');

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
          {/* App Name - MVP: No app switcher, just show "Plato" */}
          <div className="mb-3">
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-base font-semibold text-gray-900 flex-1">Plato</span>
            </div>
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
              // MVP: Use href as-is, no app conversion
              const href = item.href;
              
              // Check active state
              const normalizedPathname = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
              const normalizedHref = href.endsWith("/") && href !== "/" ? href.slice(0, -1) : href;
              const isActive = normalizedPathname === normalizedHref || 
                (normalizedHref !== "/dashboard" && normalizedPathname.startsWith(normalizedHref + "/"));
              
                      return (
                        <a
                          key={item.value}
                  href={href}
                  onClick={() => onClose()}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-5 h-5 flex-shrink-0">{item.icon}</div>
                  <span className="flex-1">{item.label}</span>
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
              href={settingsItem.href}
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
