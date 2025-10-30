"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ALL_NAVIGATION_ITEMS, getFilteredNavigationItems } from "@/lib/navigation-config";
import { AppSwitcher } from "./AppSwitcher";
import { useAppContext } from "./AppContextProvider";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  const { activeApp, switchToApp } = useAppContext();
  
  // Debug: Log active app and filtered items
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const filtered = getFilteredNavigationItems(activeApp?.id || null);
      console.log('🔍 Sidebar Debug:', {
        pathname,
        activeApp: activeApp?.id || 'null',
        filteredItems: filtered.map(i => ({ value: i.value, appContext: i.appContext })),
        settingsInFiltered: filtered.some(i => i.value === 'account')
      });
    }
  }, [activeApp, pathname]);

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
    // On desktop, sidebar is always compact (w-16). On touch devices, use collapsed/pinned state
    const isActuallyCollapsed = isTouchDevice 
      ? (collapsed && !pinned) 
      : true; // Always compact on desktop
    document.body.classList.toggle('sidebar-collapsed', isActuallyCollapsed);
    document.body.classList.toggle('sidebar-expanded', !isActuallyCollapsed);
  }, [collapsed, pinned, isTouchDevice]);

  // Get sidebar color classes based on active app
  const getSidebarColors = () => {
    if (!activeApp) return {
      bg: 'bg-white/90',
      border: 'border-gray-200',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-100',
      active: 'bg-emerald-50 text-emerald-700'
    };
    
    switch (activeApp.id) {
      case 'recipes':
        return {
          bg: 'bg-emerald-50/90',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          hover: 'hover:bg-emerald-100',
          active: 'bg-emerald-100 text-emerald-800'
        };
      case 'teams':
        return {
          bg: 'bg-blue-50/90',
          border: 'border-blue-200',
          text: 'text-blue-800',
          hover: 'hover:bg-blue-100',
          active: 'bg-blue-100 text-blue-800'
        };
      case 'production':
        return {
          bg: 'bg-purple-50/90',
          border: 'border-purple-200',
          text: 'text-purple-800',
          hover: 'hover:bg-purple-100',
          active: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          bg: 'bg-white/90',
          border: 'border-gray-200',
          text: 'text-gray-700',
          hover: 'hover:bg-gray-100',
          active: 'bg-emerald-50 text-emerald-700'
        };
    }
  };

  const colors = getSidebarColors();

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
              : 'w-16' // Always compact on desktop
          } transition-all duration-300 ease-out h-full flex flex-col py-3 ${colors.bg} backdrop-blur-md border-r ${colors.border} shadow-sm`}
        >
          {/* Header controls */}
          <div className="flex flex-col gap-2 px-2 items-start">
            {/* Collapse button - only on mobile/touch devices */}
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className={`${isTouchDevice ? 'block' : 'hidden'} w-10 h-10 rounded-lg border ${colors.border} bg-white ${colors.text} ${colors.hover} active:bg-gray-100 transition-all duration-200 touch-manipulation`}
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
            
            {/* Dashboard icon */}
            <div className="relative group w-10">
              <a
                href="/dashboard"
                className={`w-10 h-10 rounded-lg border ${colors.border} bg-white ${pathname === '/dashboard' ? colors.active : `${colors.text} ${colors.hover}`} active:bg-gray-100 transition-all duration-200 touch-manipulation flex items-center justify-center`}
                title="Dashboard"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </a>
              
              {/* Desktop hover tooltip */}
              {!isTouchDevice && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                  <div className={`px-3 py-1.5 rounded-lg border ${colors.border} bg-white ${colors.text} shadow-lg whitespace-nowrap text-sm font-medium`}>
                    Dashboard
                  </div>
                  {/* Tooltip arrow pointing left */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'white' }}></div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'rgb(209 213 219)' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="mt-2 space-y-1 px-2 flex-1">
            {getFilteredNavigationItems(activeApp?.id || null)
              .filter(item => {
                // Exclude dashboard - it's in the header
                if (item.value === 'dashboard') return false;
                return true;
              })
              .sort((a, b) => {
                // Sort to ensure Settings (account) appears at the bottom
                if (a.value === 'account') return 1; // Move Settings to end
                if (b.value === 'account') return -1; // Keep other items before Settings
                return 0; // Keep original order for other items
              })
              .map((item) => {
              const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
              return (
                <div key={item.value} className="relative group">
                  <a 
                    href={item.href} 
                    className={`w-10 h-10 rounded-lg border ${colors.border} bg-white ${active ? colors.active : `${colors.text} ${colors.hover}`} active:bg-gray-100 transition-all duration-200 touch-manipulation flex items-center justify-center`}
                    title={item.label}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                  </a>
                  
                  {/* Desktop hover tooltip - styled like icon boxes */}
                  {!isTouchDevice && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
                      <div className={`px-3 py-1.5 rounded-lg border ${colors.border} bg-white ${colors.text} shadow-lg whitespace-nowrap text-sm font-medium`}>
                        {item.label}
                      </div>
                      {/* Tooltip arrow pointing left */}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'white' }}></div>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-[1px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'rgb(209 213 219)' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Plato OS App Switcher - Bottom of sidebar */}
          <div className="px-2 pb-2 space-y-1">
            <AppSwitcher 
              activeApp={activeApp} 
              onAppChange={(app) => {
                switchToApp(app.id);
                // Navigate to the app's main route using Next.js router
                router.push(app.route);
              }}
              collapsed={isTouchDevice ? (collapsed && !pinned) : true}
              isHovered={false}
              isTouchDevice={isTouchDevice}
            />
            
          </div>
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
            <div className="relative h-full rounded-r-3xl shadow-2xl overflow-hidden bg-gradient-to-b from-emerald-600 via-emerald-500 to-emerald-700 text-white/95 backdrop-blur-md flex flex-col">
              <div className="pointer-events-none absolute inset-y-0 right-2 w-12 rounded-l-3xl bg-white/10 blur-2xl opacity-60" />
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4">
                <div className="flex items-center gap-2">
                  {/* Dashboard icon */}
                  <a
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      pathname === '/dashboard' ? 'bg-white/30' : 'bg-white/20 hover:bg-white/25'
                    }`}
                    title="Dashboard"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </a>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Menu list */}
              <nav className="px-2 py-2 flex-1 overflow-y-auto">
                {getFilteredNavigationItems(activeApp?.id || null)
                  .filter(item => {
                    // Exclude dashboard - it's in the header
                    if (item.value === 'dashboard') return false;
                    return true;
                  })
                  .sort((a, b) => {
                    // Sort to ensure Settings (account) appears at the bottom
                    if (a.value === 'account') return 1; // Move Settings to end
                    if (b.value === 'account') return -1; // Keep other items before Settings
                    return 0; // Keep original order for other items
                  })
                  .map((item, index) => (
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