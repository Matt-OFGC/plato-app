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

  // Listen for toggle-sidebar event from keyboard shortcuts
  useEffect(() => {
    const handleToggleSidebar = () => {
      if (isTouchDevice) {
        setCollapsed(!collapsed);
      } else {
        // On desktop, just toggle the sidebar state
        setCollapsed(!collapsed);
      }
    };

    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, [collapsed, isTouchDevice]);

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
        className="md:hidden fixed left-3 top-3 z-50 rounded-full liquid-glass-green liquid-glass-reflection w-11 h-11 flex items-center justify-center shadow-lg animate-spring"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {/* Fixed compact sidebar on md+; hidden on mobile. Ultra-thin translucent rail with hover expansion */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 will-change-transform [position:sticky] md:[position:fixed] group/sidebar">
        <div 
          className={`${
            isTouchDevice 
              ? (collapsed && !pinned ? 'w-16' : 'w-64')
              : 'w-16 group-hover/sidebar:w-64' // Expand on hover for desktop
          } transition-all duration-300 h-full flex flex-col py-3 liquid-glass-green liquid-glass-reflection border-r border-white/30 shadow-lg`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        >
          {/* Reflection highlight along top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
          {/* Header controls */}
          <div className="flex flex-col gap-2 px-2 items-start relative z-10">
            {/* Collapse button - only on mobile/touch devices */}
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className={`${isTouchDevice ? 'block' : 'hidden'} w-10 h-10 rounded-xl liquid-glass liquid-glass-hover liquid-glass-ripple ${colors.text} touch-manipulation`}
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                className={`w-4 h-4 m-auto transition-transform duration-300 animate-spring ${collapsed ? 'rotate-0' : 'rotate-180'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            
            {/* Dashboard icon */}
            <div className="relative group/item w-10">
              <a
                href="/dashboard"
                className={`w-10 h-10 rounded-xl liquid-glass liquid-glass-hover liquid-glass-ripple flex items-center justify-center transition-all duration-200 touch-manipulation ${
                  pathname === '/dashboard' 
                    ? 'liquid-glass-glow scale-105 shadow-lg shadow-emerald-500/20' 
                    : `${colors.text}`
                }`}
                title="Dashboard"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="w-5 h-5 flex items-center justify-center relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </a>
              
              {/* Desktop hover tooltip with glass styling */}
              {!isTouchDevice && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-all duration-200 z-50 animate-spring">
                  <div className="px-3 py-1.5 rounded-xl liquid-glass liquid-glass-reflection text-gray-800 shadow-xl whitespace-nowrap text-sm font-medium">
                    Dashboard
                  </div>
                  {/* Tooltip arrow pointing left */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white/60"></div>
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation - Grouped by App Context */}
          <nav className="mt-2 space-y-4 px-2 flex-1 overflow-y-auto">
            {(() => {
              const filteredItems = getFilteredNavigationItems(activeApp?.id || null)
                .filter(item => item.value !== 'dashboard' && item.value !== 'account');
              
              // Group items by app context
              const grouped = filteredItems.reduce((acc, item) => {
                const context = item.appContext || 'global';
                if (!acc[context]) acc[context] = [];
                acc[context].push(item);
                return acc;
              }, {} as Record<string, typeof filteredItems>);

              // Define section order and labels
              const sectionOrder = ['recipes', 'teams', 'production', 'safety', 'global'];
              const sectionLabels: Record<string, string> = {
                recipes: 'RECIPES',
                teams: 'TEAMS',
                production: 'PRODUCTION DETAIL',
                safety: 'HYGIENE & SAFETY',
                global: 'OTHER'
              };

              return sectionOrder.map(sectionKey => {
                const items = grouped[sectionKey] || [];
                if (items.length === 0) return null;

                return (
                  <div key={sectionKey} className="space-y-1">
                    {/* Section Header - only show on expanded sidebar */}
                    {(!isTouchDevice || !collapsed || pinned) && (
                      <div className="px-2 py-1.5 flex items-center justify-between group/section">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          {sectionLabels[sectionKey] || sectionKey.toUpperCase()}
                        </span>
                        {sectionKey !== 'global' && (
                          <span className="text-[9px] text-gray-400 opacity-0 group-hover/section:opacity-100 transition-opacity">
                            DETAIL
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Section Items */}
                    {items.map((item) => {
                      const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
                      return (
                        <div key={item.value} className="relative group/nav-item">
                          <a 
                            href={item.href} 
                            className={`w-10 h-10 rounded-xl liquid-glass liquid-glass-hover liquid-glass-ripple flex items-center justify-center transition-all duration-200 touch-manipulation ${
                              active 
                                ? 'liquid-glass-glow scale-105 shadow-lg shadow-emerald-500/20 text-emerald-700' 
                                : `${colors.text}`
                            }`}
                            title={item.label}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                            <div className="w-5 h-5 flex items-center justify-center relative z-10">
                              {item.icon}
                            </div>
                            {/* Active indicator pill */}
                            {active && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full opacity-80" />
                            )}
                          </a>
                          
                          {/* Desktop hover tooltip with glass styling */}
                          {!isTouchDevice && (
                            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/nav-item:opacity-100 pointer-events-none transition-all duration-200 z-50 animate-spring">
                              <div className="px-3 py-1.5 rounded-xl liquid-glass liquid-glass-reflection text-gray-800 shadow-xl whitespace-nowrap text-sm font-medium">
                                {item.label}
                              </div>
                              {/* Tooltip arrow pointing left */}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white/60"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }).filter(Boolean);
            })()}
          </nav>

          {/* Settings and Logout - Bottom of sidebar */}
          <div className="px-2 pb-2 space-y-2">
            {/* Settings Link */}
            <div className="relative group/nav-item">
              <a 
                href="/dashboard/account" 
                className={`w-10 h-10 rounded-xl liquid-glass liquid-glass-hover liquid-glass-ripple flex items-center justify-center transition-all duration-200 touch-manipulation ${
                  pathname.startsWith('/dashboard/account')
                    ? 'liquid-glass-glow scale-105 shadow-lg shadow-indigo-500/20 text-indigo-700' 
                    : `${colors.text}`
                }`}
                title="Settings"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="w-5 h-5 flex items-center justify-center relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                {pathname.startsWith('/dashboard/account') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full opacity-80" />
                )}
              </a>
              
              {/* Desktop hover tooltip */}
              {!isTouchDevice && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/nav-item:opacity-100 pointer-events-none transition-all duration-200 z-50 animate-spring">
                  <div className="px-3 py-1.5 rounded-xl liquid-glass liquid-glass-reflection text-gray-800 shadow-xl whitespace-nowrap text-sm font-medium">
                    Settings
                  </div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white/60"></div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="relative group/logout">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/logout', { method: 'POST' });
                    router.push('/');
                    router.refresh();
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="w-10 h-10 rounded-xl liquid-glass liquid-glass-hover liquid-glass-ripple flex items-center justify-center transition-all duration-200 touch-manipulation text-red-600 hover:text-red-700 hover:bg-red-50/50"
                title="Logout"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="w-5 h-5 flex items-center justify-center relative z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </button>
              
              {/* Desktop hover tooltip */}
              {!isTouchDevice && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/logout:opacity-100 pointer-events-none transition-all duration-200 z-50 animate-spring">
                  <div className="px-3 py-1.5 rounded-xl liquid-glass liquid-glass-reflection text-gray-800 shadow-xl whitespace-nowrap text-sm font-medium">
                    Logout
                  </div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white/60"></div>
                </div>
              )}
            </div>

            {/* Plato OS App Switcher */}
            <div className="pt-2 border-t border-white/10">
              <AppSwitcher 
                activeApp={activeApp} 
                onAppChange={(app) => {
                  switchToApp(app.id);
                  router.push(app.route);
                }}
                collapsed={isTouchDevice ? (collapsed && !pinned) : true}
                isHovered={false}
                isTouchDevice={isTouchDevice}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Liquid Glass drawer for full navigation when menu is opened */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Dim background with blur */}
          <div 
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
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

          {/* Sliding rounded drawer with Liquid Glass styling */}
          <div className={`absolute left-0 top-0 bottom-0 w-88 max-w-80 p-4 transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
               style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
            <div className="relative h-full rounded-r-3xl shadow-2xl overflow-hidden liquid-glass-green liquid-glass-reflection flex flex-col">
              {/* Green gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-emerald-500/10 to-transparent rounded-r-3xl" />
              
              {/* Reflection highlight */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/30 via-white/10 to-transparent rounded-t-r-3xl" />
              
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] py-4 relative z-10">
                <div className="flex items-center gap-2">
                  {/* Dashboard icon */}
                  <a
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={`w-9 h-9 rounded-xl liquid-glass flex items-center justify-center transition-all duration-200 ${
                      pathname === '/dashboard' 
                        ? 'bg-emerald-500/20 text-emerald-700 scale-105' 
                        : 'bg-white/10 text-gray-700 hover:bg-white/20'
                    }`}
                    title="Dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </a>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-9 h-9 rounded-xl liquid-glass bg-white/10 text-gray-700 hover:bg-white/20 flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Menu list - Grouped by App Context */}
              <nav className="px-2 py-2 flex-1 overflow-y-auto relative z-10">
                {(() => {
                  const filteredItems = getFilteredNavigationItems(activeApp?.id || null)
                    .filter(item => item.value !== 'dashboard' && item.value !== 'account');
                  
                  // Group items by app context
                  const grouped = filteredItems.reduce((acc, item) => {
                    const context = item.appContext || 'global';
                    if (!acc[context]) acc[context] = [];
                    acc[context].push(item);
                    return acc;
                  }, {} as Record<string, typeof filteredItems>);

                  // Define section order and labels
                  const sectionOrder = ['recipes', 'teams', 'production', 'safety', 'global'];
                  const sectionLabels: Record<string, string> = {
                    recipes: 'RECIPES',
                    teams: 'TEAMS',
                    production: 'PRODUCTION DETAIL',
                    safety: 'HYGIENE & SAFETY',
                    global: 'OTHER'
                  };

                  let itemIndex = 0;
                  return sectionOrder.map(sectionKey => {
                    const items = grouped[sectionKey] || [];
                    if (items.length === 0) return null;

                    return (
                      <div key={sectionKey} className="mb-4">
                        {/* Section Header */}
                        <div className="px-4 py-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {sectionLabels[sectionKey] || sectionKey.toUpperCase()}
                          </span>
                          {sectionKey !== 'global' && (
                            <span className="text-[9px] text-gray-400">
                              DETAIL
                            </span>
                          )}
                        </div>
                        
                        {/* Section Items */}
                        <div className="space-y-1">
                          {items.map((item) => {
                            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
                            const currentIndex = itemIndex++;
                            return (
                              <a
                                key={item.value}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl liquid-glass-hover transition-all duration-200 animate-drawer-item ${
                                  active 
                                    ? 'bg-emerald-500/20 text-emerald-700 scale-[1.02] shadow-md' 
                                    : 'hover:bg-white/10 active:bg-white/15 text-gray-700'
                                }`}
                                style={{ animationDelay: `${currentIndex * 40}ms` }}
                              >
                                <div className={`${active ? 'text-emerald-600' : 'text-gray-600'}`}>
                                  {item.icon}
                                </div>
                                <span className="text-[16px] font-medium tracking-tight">
                                  {item.label}
                                </span>
                                {active && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }).filter(Boolean);
                })()}

                {/* Settings and Logout - Bottom of drawer */}
                <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                  {/* Settings Link */}
                  <a
                    href="/dashboard/account"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl liquid-glass-hover transition-all duration-200 ${
                      pathname.startsWith('/dashboard/account')
                        ? 'bg-indigo-500/20 text-indigo-700 scale-[1.02] shadow-md' 
                        : 'hover:bg-white/10 active:bg-white/15 text-gray-700'
                    }`}
                  >
                    <div className={`${pathname.startsWith('/dashboard/account') ? 'text-indigo-600' : 'text-gray-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-[16px] font-medium tracking-tight">Settings</span>
                    {pathname.startsWith('/dashboard/account') && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </a>

                  {/* Logout Button */}
                  <button
                    onClick={async () => {
                      setIsOpen(false);
                      try {
                        await fetch('/api/logout', { method: 'POST' });
                        router.push('/');
                        router.refresh();
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl liquid-glass-hover hover:bg-red-50/50 active:bg-red-50/70 text-red-600 hover:text-red-700 transition-all duration-200"
                  >
                    <div className="text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="text-[16px] font-medium tracking-tight">Logout</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}