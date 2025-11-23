"use client";

import { useState, useMemo } from "react";
import { FloatingNavBar } from "./FloatingNavBar";
import { useSidebar } from "@/contexts/SidebarContext";
import { isNavigationItemVisible } from "@/lib/mvp-config";

// Fixed navigation items for MVP - only show essential items
const MVP_FIXED_NAVIGATION_ITEMS = ["dashboard", "ingredients", "recipes", "recipe-mixer"];

// All items that can appear in the More menu
const ALL_MORE_MENU_ITEMS = [
  { 
    id: "inventory", 
    value: "inventory",
    label: "Inventory", 
    href: "/dashboard/inventory", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    id: "wholesale", 
    value: "wholesale",
    label: "Wholesale", 
    href: "/dashboard/wholesale", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    id: "analytics", 
    value: "analytics",
    label: "Analytics", 
    href: "/dashboard/analytics", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    id: "team", 
    value: "team",
    label: "Team", 
    href: "/dashboard/team", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    id: "settings", 
    value: "account",
    label: "Settings", 
    href: "/dashboard/account", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    id: "business", 
    value: "business",
    label: "Business", 
    href: "/dashboard/business", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  { 
    id: "safety", 
    value: "safety",
    label: "Safety", 
    href: "/dashboard/safety", 
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
];

export function DashboardNavWrapper() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { sidebarOpen } = useSidebar();

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  // Filter MORE_MENU_ITEMS based on MVP mode
  const MORE_MENU_ITEMS = useMemo(() => {
    return ALL_MORE_MENU_ITEMS.filter(item => isNavigationItemVisible(item.value));
  }, []);

  // Filter FIXED_NAVIGATION_ITEMS based on MVP mode
  const FIXED_NAVIGATION_ITEMS = useMemo(() => {
    return MVP_FIXED_NAVIGATION_ITEMS.filter(item => isNavigationItemVisible(item));
  }, []);

  return (
    <>
      {/* Floating Navigation Bar with fixed items */}
      <FloatingNavBar 
        navigationItems={FIXED_NAVIGATION_ITEMS}
        enableScrollAnimation={true}
        onMoreClick={handleMoreClick}
        sidebarOpen={sidebarOpen}
      />
      
      {/* More Menu Overlay - Glassy Design with Green Tint */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)}>
          <div className="fixed left-20 top-1/2 -translate-y-1/2 right-4 md:left-24 md:right-8 lg:left-28 lg:right-12 xl:left-32 xl:right-16">
            {/* Glassy container matching the floating nav bar style with green tint */}
            <div className="floating-nav-enhanced rounded-3xl p-6 shadow-2xl max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">More</h3>
              
              {/* Grid of items with glassy floating nav style and green tint */}
              <div className="grid grid-cols-2 gap-4">
                {MORE_MENU_ITEMS.map((item) => (
                  <a 
                    key={item.id}
                    href={item.href} 
                    className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-emerald-50/30 hover:border-emerald-200/50 hover:scale-105 transition-all duration-300 ease-out shadow-lg hover:shadow-xl"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <div className="text-gray-600 group-hover:text-emerald-600 mb-2 group-hover:scale-110 transition-all duration-300">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-800 group-hover:text-emerald-800 transition-colors">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}