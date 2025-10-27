"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ALL_NAVIGATION_ITEMS } from "@/lib/navigation-config";
import { AppSwitcher } from "./AppSwitcher";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const pathname = usePathname();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  // Detect touch device and handle mobile behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect if device supports touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
    
    const isMobile = window.innerWidth < 768;
    if (isMobile && isOpen) {
      document.body.classList.add('mobile-drawer-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.classList.remove('mobile-drawer-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  const [navigationItems, setNavigationItems] = useState<string[]>(["dashboard", "ingredients", "recipes", "recipe-mixer"]);

  // Persist collapsed/pinned
  useEffect(() => {
    try {
      const savedPinned = localStorage.getItem('sidebar_pinned');
      if (savedPinned) setPinned(savedPinned === 'true');
      const savedCollapsed = localStorage.getItem('sidebar_collapsed');
      if (savedCollapsed) setCollapsed(savedCollapsed === 'true');
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('sidebar_pinned', String(pinned)); } catch {} }, [pinned]);
  useEffect(() => { try { localStorage.setItem('sidebar_collapsed', String(collapsed)); } catch {} }, [collapsed]);

  // Apply body class to adjust main padding so pages don't hide behind sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // On touch devices, don't use hover state - only use collapsed/pinned
    const isActuallyCollapsed = isTouchDevice 
      ? (collapsed && !pinned) 
      : (collapsed && !pinned && !isHovered);
    document.body.classList.toggle('sidebar-collapsed', isActuallyCollapsed);
    document.body.classList.toggle('sidebar-expanded', !isActuallyCollapsed);
  }, [collapsed, pinned, isHovered, isTouchDevice]);

  // Fetch navigation preferences
  useEffect(() => {
    fetch("/api/user/navigation-preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data.navigationItems) {
          setNavigationItems(data.navigationItems);
        }
      })
      .catch(() => {
        // Use defaults if API fails
        setNavigationItems(["dashboard", "ingredients", "recipes", "recipe-mixer"]);
      });
  }, []);

  return (
    <>
      {/* Mobile header menu trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed left-3 top-3 z-50 rounded-full bg-white/70 backdrop-blur-lg border border-white/60 shadow-md w-11 h-11 flex items-center justify-center"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {/* Fixed compact sidebar on md+; hidden on mobile. Use sticky containment to keep it stationary */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 will-change-transform [position:sticky] md:[position:fixed]">
        <div 
          className={`${
            isTouchDevice 
              ? (collapsed && !pinned ? 'w-16' : 'w-64')
              : (collapsed && !pinned && !isHovered ? 'w-16' : 'w-64')
          } transition-all duration-300 ease-out h-full flex flex-col py-3 bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-sm`}
          onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
          onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
        >
          {/* Header controls */}
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 touch-manipulation" 
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                className={`w-4 h-4 m-auto transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            {/* Removed the 3-stripe image; only the collapse button remains as requested */}
          </div>

          {/* App Switcher - NEW! */}
          {(!collapsed || pinned || isHovered) && (
            <div className="mt-4 px-2">
              <AppSwitcher />
            </div>
          )}

          {/* List */}
          <nav className="mt-2 space-y-1 px-2">
            {ALL_NAVIGATION_ITEMS.map((item) => {
              const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
              // On touch devices, show labels when not collapsed or when pinned
              // On non-touch devices, also show on hover
              const shouldShowLabel = isTouchDevice 
                ? !(collapsed && !pinned)
                : (!(collapsed && !pinned) || isHovered);
              return (
                <a key={item.value} href={item.href} className={`group flex items-center gap-3 rounded-md px-2 ${active ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-100 text-gray-700'} transition-colors h-10`}>
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${active ? 'text-emerald-700' : 'text-gray-700'}`}>{item.icon}</div>
                  <span className={`${shouldShowLabel ? 'opacity-100 w-auto' : 'opacity-0 w-0'} transition-all duration-300 text-sm font-medium whitespace-nowrap`}>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Glassy drawer for full navigation when menu is opened */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dim background */}
          <div 
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsOpen(false)}
            onTouchStart={(e) => {
              const t = e.touches[0];
              setTouchStartX(t.clientX);
              setTouchStartY(t.clientY);
            }}
            onTouchMove={(e) => {
              if (touchStartX == null || touchStartY == null) return;
              const t = e.touches[0];
              const dx = t.clientX - touchStartX;
              const dy = t.clientY - touchStartY;
              if (Math.abs(dx) > Math.abs(dy) && dx < -50) {
                setIsOpen(false);
                setTouchStartX(null);
                setTouchStartY(null);
              }
            }}
            onTouchEnd={() => { setTouchStartX(null); setTouchStartY(null); }}
          />

          {/* Sliding rounded drawer inspired by the provided design */}
          <div className={`absolute left-0 top-0 bottom-0 w-88 max-w-80 p-4 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-6'}`}
               style={{ transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1.05)' }}>
            <div className="relative h-full rounded-r-3xl shadow-2xl overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 text-white/95 backdrop-blur-md">
              <div className="pointer-events-none absolute inset-y-0 right-2 w-12 rounded-l-3xl bg-white/10 blur-2xl opacity-60" />
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 1118.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Menu list */}
              <nav className="px-2 py-2">
                {ALL_NAVIGATION_ITEMS.map((item, index) => (
                  <a
                    key={item.value}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors animate-drawer-item"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="text-white">
                      {item.icon}
                    </div>
                    <span className="text-[16px] font-medium tracking-tight">
                      {item.label}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}