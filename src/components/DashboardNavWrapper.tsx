"use client";

import { useState, useEffect } from "react";
import { FloatingNavBar } from "@/components/FloatingNavBar";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", enabled: true, order: 1 },
  { id: "recipes", label: "Recipes", href: "/dashboard/recipes", enabled: true, order: 2 },
  { id: "ingredients", label: "Ingredients", href: "/dashboard/ingredients", enabled: true, order: 3 },
  { id: "inventory", label: "Inventory", href: "/dashboard/inventory", enabled: true, order: 4 },
  { id: "production", label: "Production", href: "/dashboard/production", enabled: true, order: 5 },
  { id: "wholesale", label: "Wholesale", href: "/dashboard/wholesale", enabled: true, order: 6 },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics", enabled: true, order: 7 },
  { id: "team", label: "Team", href: "/dashboard/team", enabled: true, order: 8 },
];

export function DashboardNavWrapper() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [navigationItems, setNavigationItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNavigationSettings();
  }, []);

  const loadNavigationSettings = async () => {
    try {
      const response = await fetch('/api/user/navigation-preferences');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.navigationItems && Array.isArray(data.navigationItems)) {
          // Get enabled items sorted by order, then map to href values
          const enabledItems = data.navigationItems
            .filter((item: NavigationItem) => item.enabled)
            .sort((a: NavigationItem, b: NavigationItem) => a.order - b.order)
            .map((item: NavigationItem) => item.id);
          
          setNavigationItems(enabledItems);
        } else {
          // Use default items if no preferences saved
          setNavigationItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
        }
      } else {
        // Use default items if API call fails
        setNavigationItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
      }
    } catch (error) {
      console.error('Error loading navigation settings:', error);
      setNavigationItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
    console.log('More navigation clicked - toggle menu');
  };

  // Don't render until we have navigation items loaded
  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Floating Navigation Bar with Apple-style scroll animations */}
      <FloatingNavBar 
        navigationItems={navigationItems}
        enableScrollAnimation={true}
        onMoreClick={handleMoreClick}
      />
      
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)}>
          <div className="fixed bottom-20 left-4 right-4 md:left-8 md:right-8 lg:left-12 lg:right-12 xl:left-16 xl:right-16">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More Navigation</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_NAVIGATION_ITEMS
                  .filter(item => !navigationItems.includes(item.id)) // Show items not in main nav
                  .map((item) => (
                    <a 
                      key={item.id}
                      href={item.href} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-medium">{item.label}</span>
                    </a>
                  ))}
                
                {/* Always show Account and Business in More menu */}
                <a 
                  href="/dashboard/account" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium">Account</span>
                </a>
                
                <a 
                  href="/dashboard/business" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setShowMoreMenu(false)}
                >
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm font-medium">Business</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
