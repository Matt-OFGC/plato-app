"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTimers } from "@/contexts/TimerContext";
import { ALL_NAVIGATION_ITEMS, NavigationItem } from "@/lib/navigation-config";

interface FloatingNavBarProps {
  navigationItems?: string[]; // Array of hrefs for selected nav items
  onMoreClick?: () => void;
}

export function FloatingNavBar({ 
  navigationItems = ["dashboard", "ingredients", "recipes", "recipe-mixer"],
  onMoreClick 
}: FloatingNavBarProps) {
  const pathname = usePathname();
  const { timers } = useTimers();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter nav items based on user selection
  const selectedNavItems = ALL_NAVIGATION_ITEMS.filter(item => 
    navigationItems.includes(item.value)
  );

  // Ensure we have exactly 4 items for the floating nav
  const displayNavItems = selectedNavItems.slice(0, 4);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      // Only active if exactly on dashboard page
      return pathname === '/dashboard';
    } else {
      // For other pages, check if pathname starts with the path
      return pathname.startsWith(path);
    }
  };

  const timerCount = Object.keys(timers).length;


  return (
    <>
      {/* Floating Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 md:left-8 md:right-8 lg:left-12 lg:right-12 xl:left-16 xl:right-16 safe-area-bottom">
        <div className={`floating-nav rounded-3xl px-4 py-2 mx-auto max-w-md ${timerCount > 0 ? 'animate-pulse-subtle' : ''}`}>
          <div className="flex items-center justify-between">
            {/* Navigation Items */}
            <div className="flex items-center space-x-1 flex-1">
              {displayNavItems.map((item, index) => {
                const active = isActive(item.href);
                const isHovered = hoveredItem === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`floating-nav-item flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ease-out group relative ${
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
                    <span className={`text-xs font-medium mt-1 truncate max-w-[60px] transition-all duration-300 ${
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
                className={`floating-nav-item flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ease-out group relative ${
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
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
              <div className="ml-2 flex-shrink-0">
                <div className="relative">
                  <button 
                    onMouseEnter={() => setHoveredItem('timer')}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`floating-nav-item p-2 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 group relative overflow-hidden ${
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