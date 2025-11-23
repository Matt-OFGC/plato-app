"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTimers } from "@/contexts/TimerContext";
import { ALL_NAVIGATION_ITEMS, NavigationItem } from "@/lib/navigation-config";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

interface FloatingNavBarProps {
  navigationItems?: string[]; // Array of hrefs for selected nav items
  onMoreClick?: () => void;
  enableScrollAnimation?: boolean; // Enable Apple-style scroll animations
  sidebarOpen?: boolean; // Hide when sidebar is open
}

export function FloatingNavBar({ 
  navigationItems = ["dashboard", "ingredients", "recipes", "recipe-mixer"], // MVP default items
  onMoreClick,
  enableScrollAnimation = false,
  sidebarOpen = false
}: FloatingNavBarProps) {
  const pathname = usePathname();
  const { timers } = useTimers();
  const { toAppRoute } = useAppAwareRoute();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Apple-style scroll animation
  // Always visible: disable scroll hide/show
  const isVisible = true;
  const isScrollingDown = false;
  const hasScrolled = false;

  // Filter nav items based on user selection
  const selectedNavItems = ALL_NAVIGATION_ITEMS.filter(item => 
    navigationItems.includes(item.value)
  );

  // Ensure we have exactly 4 items for the floating nav
  const displayNavItems = selectedNavItems.slice(0, 4).map(item => ({
    ...item,
    href: toAppRoute(item.href) // Convert to app-aware route
  }));

  const isActive = (path: string) => {
    // Normalize paths for comparison (remove trailing slashes)
    const normalizePath = (p: string) => p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
    const normalizedPath = normalizePath(path);
    const normalizedPathname = normalizePath(pathname);
    
    // Check against current pathname (which is already app-aware)
    if (normalizedPath === '/dashboard' || normalizedPath === '/bake') {
      // Only active if exactly on dashboard/bake page
      return normalizedPathname === normalizedPath;
    } else {
      // For other pages, check if pathname starts with the path
      // Also handle exact matches
      return normalizedPathname === normalizedPath || normalizedPathname.startsWith(normalizedPath + "/");
    }
  };

  const timerCount = Object.keys(timers).length;

  return (
    <>
      {/* Fixed slim left rail for md+ */}
      {/* Hide when sidebar is open to prevent overlap */}
      <nav className={`hidden md:block fixed left-1 top-1/2 -translate-y-1/2 z-50 md:left-2 lg:left-3 xl:left-4 safe-area-left transition-all duration-300 ease-out ${
        sidebarOpen || !isVisible
          ? '-translate-x-full opacity-0 pointer-events-none' 
          : 'translate-x-0 opacity-100'
      }`}>
        <div className={`floating-nav floating-nav-enhanced rounded-3xl px-2 py-2.5 mx-auto max-h-md transition-all duration-300 ease-out ${
          timerCount > 0 ? 'animate-pulse-subtle' : ''
        } ${
          hasScrolled && isScrollingDown 
            ? 'scale-95 shadow-lg' 
            : 'scale-100 shadow-md'
        }`}>
          <div className="flex flex-col items-center justify-between h-full">
            {/* Navigation Items */}
            <div className="flex flex-col items-center space-y-1 flex-1">
              {displayNavItems.map((item, index) => {
                const appAwareHref = item.href; // Already converted above
                const active = isActive(appAwareHref);
                const isHovered = hoveredItem === appAwareHref;
                return (
                  <Link
                    key={appAwareHref}
                    href={appAwareHref}
                    onMouseEnter={() => setHoveredItem(appAwareHref)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`floating-nav-item flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ease-out group relative touch-target w-11 h-11 ${
                      active 
                        ? "floating-nav-active text-black shadow-lg scale-105" 
                        : `text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 ${
                            isHovered ? 'scale-105 shadow-md' : ''
                          }`
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      transform: isHovered && !active ? 'translateY(-2px) scale(1.05)' : undefined,
                    }}
                  >
                    <div className={`transition-all duration-300 ${
                      active 
                        ? "text-white scale-110" 
                        : `text-gray-500 group-hover:text-gray-700 ${
                            isHovered ? 'scale-110' : ''
                          }`
                    }`}>
                      {item.icon}
                    </div>
                    <span className={`text-[9px] font-medium mt-0.5 truncate max-w-[44px] transition-all duration-300 ${
                      isHovered ? 'text-gray-800 font-semibold' : ''
                    }`}>
                      {item.shortLabel}
                    </span>
                    
                    {/* Ripple effect */}
                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                      isHovered ? 'bg-white/10 opacity-100' : 'opacity-0'
                    }`} />
                  </Link>
                );
              })}
              
              {/* More Button */}
              <button
                onClick={() => onMoreClick?.()}
                onMouseEnter={() => setHoveredItem('more')}
                onMouseLeave={() => setHoveredItem(null)}
                className={`floating-nav-item flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ease-out group relative w-11 h-11 ${
                  hoveredItem === 'more' 
                    ? 'text-gray-700 bg-gray-100/50 scale-105 shadow-md' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                }`}
                style={{
                  animationDelay: `${displayNavItems.length * 50}ms`,
                  transform: hoveredItem === 'more' ? 'translateY(-2px) scale(1.05)' : undefined,
                }}
              >
                <div className={`transition-all duration-300 ${
                  hoveredItem === 'more' ? 'scale-110 text-gray-700' : 'text-gray-500'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <span className={`text-[8px] font-medium mt-0.5 transition-all duration-300 ${
                  hoveredItem === 'more' ? 'text-gray-800 font-semibold' : ''
                }`}>
                  More
                </span>
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                  hoveredItem === 'more' ? 'bg-white/10 opacity-100' : 'opacity-0'
                }`} />
              </button>
            </div>

            {/* Timer Badge */}
            {timerCount > 0 && (
              <div className="mt-2 flex-shrink-0">
                <div className="relative">
                  <button 
                    onMouseEnter={() => setHoveredItem('timer')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`floating-nav-item p-2 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 group relative overflow-hidden w-12 h-12 ${
                      hoveredItem === 'timer' ? 'scale-110 shadow-lg' : ''
                    }`}
                    style={{
                      transform: hoveredItem === 'timer' ? 'translateY(-2px) scale(1.1)' : undefined,
                    }}
                  >
                    <svg className={`w-5 h-5 transition-all duration-300 ${
                      hoveredItem === 'timer' ? 'scale-110' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    
                    {/* Breathing glow effect */}
                    <div className="absolute inset-0 bg-emerald-400 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 animate-pulse" />
                  </button>
                  
                  {/* Enhanced timer badge */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold timer-badge transition-all duration-300 ${
                    hoveredItem === 'timer' ? 'scale-125 shadow-lg' : ''
                  }`}>
                    {timerCount}
                  </div>
                  
                  {/* Pulse ring for active timers */}
                  <div className="absolute -inset-1 rounded-3xl border-2 border-emerald-400 opacity-0 animate-ping" />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}